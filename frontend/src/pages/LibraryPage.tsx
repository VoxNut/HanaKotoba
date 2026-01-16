/**
 * LibraryPage - Manga Library Management
 *
 * Features:
 * - View all stored manga volumes
 * - Delete volumes
 * - Search/filter volumes
 * - Sort by name, date added, page count
 * - View storage usage
 * - Grid/List view toggle
 */

import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  FolderOpen,
  Grid,
  HardDrive,
  List,
  Loader2,
  Search,
  SortAsc,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

// ==================== IndexedDB Helper Functions ====================
const DB_NAME = "HanaKotobaMangaDB";
const DB_VERSION = 1;
const STORE_NAME = "volumes";

interface StoredVolume {
  id: string;
  name: string;
  uploadedAt?: Date; // Legacy field
  pages: Array<{ name: string; data: ArrayBuffer }>;
  pageCount: number;
  coverImage?: ArrayBuffer | string; // Can be ArrayBuffer or base64 string
  ocrResults: Record<number, unknown>;
  addedAt?: number; // Timestamp when added (optional for legacy data)
  lastReadAt?: number; // Timestamp when last read
  lastReadPage?: number; // Last page viewed
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function getVolumes(): Promise<StoredVolume[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function deleteVolume(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function clearAllVolumes(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Helper to convert ArrayBuffer to data URL for cover images
function getCoverImageUrl(
  coverImage?: ArrayBuffer | string
): string | undefined {
  if (!coverImage) return undefined;
  if (typeof coverImage === "string") return coverImage;
  // Convert ArrayBuffer to blob URL
  try {
    const blob = new Blob([coverImage], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

// ==================== Types ====================

type SortOption = "name" | "addedAt" | "pageCount" | "lastReadAt";
type ViewMode = "grid" | "list";

// ==================== Component ====================

export default function LibraryPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const navigate = useNavigate();

  // State
  const [volumes, setVolumes] = useState<StoredVolume[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("addedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedVolumes, setSelectedVolumes] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const coverUrlsRef = useRef<Record<string, string>>({});

  // Load volumes on mount
  useEffect(() => {
    loadVolumes();

    // Cleanup cover URLs on unmount
    return () => {
      Object.values(coverUrlsRef.current).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Generate cover URLs when volumes change
  useEffect(() => {
    // Revoke old blob URLs
    Object.values(coverUrlsRef.current).forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    const newUrls: Record<string, string> = {};
    volumes.forEach((vol) => {
      const url = getCoverImageUrl(vol.coverImage);
      if (url) {
        newUrls[vol.id] = url;
      }
    });
    coverUrlsRef.current = newUrls;
    setCoverUrls(newUrls);
  }, [volumes]);

  // Close sort menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadVolumes = async () => {
    setIsLoading(true);
    try {
      const storedVolumes = await getVolumes();
      setVolumes(storedVolumes);
    } catch (err) {
      console.error("Failed to load volumes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate storage usage
  const storageInfo = useMemo(() => {
    let totalBytes = 0;
    volumes.forEach((vol) => {
      vol.pages.forEach((page) => {
        totalBytes += page.data.byteLength;
      });
    });

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return {
      totalBytes,
      formatted: formatSize(totalBytes),
      volumeCount: volumes.length,
      pageCount: volumes.reduce((acc, vol) => acc + vol.pageCount, 0),
    };
  }, [volumes]);

  // Filter and sort volumes
  const filteredVolumes = useMemo(() => {
    let result = [...volumes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((vol) => vol.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "addedAt":
          comparison = (a.addedAt || 0) - (b.addedAt || 0);
          break;
        case "pageCount":
          comparison = a.pageCount - b.pageCount;
          break;
        case "lastReadAt":
          comparison = (a.lastReadAt || 0) - (b.lastReadAt || 0);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [volumes, searchQuery, sortBy, sortAsc]);

  // Handle volume deletion
  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteVolume(id);
      setVolumes((prev) => prev.filter((v) => v.id !== id));
      setSelectedVolumes((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete volume:", err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  }, []);

  // Handle bulk deletion
  const handleDeleteSelected = useCallback(async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedVolumes) {
        await deleteVolume(id);
      }
      setVolumes((prev) => prev.filter((v) => !selectedVolumes.has(v.id)));
      setSelectedVolumes(new Set());
    } catch (err) {
      console.error("Failed to delete volumes:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedVolumes]);

  // Handle delete all
  const handleDeleteAll = useCallback(async () => {
    setIsDeleting(true);
    try {
      await clearAllVolumes();
      setVolumes([]);
      setSelectedVolumes(new Set());
    } catch (err) {
      console.error("Failed to clear library:", err);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteAll(false);
    }
  }, []);

  // Toggle volume selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all / deselect all
  const toggleSelectAll = useCallback(() => {
    if (selectedVolumes.size === filteredVolumes.length) {
      setSelectedVolumes(new Set());
    } else {
      setSelectedVolumes(new Set(filteredVolumes.map((v) => v.id)));
    }
  }, [selectedVolumes.size, filteredVolumes]);

  // Open volume in reader
  const openVolume = useCallback(
    (volumeId: string) => {
      navigate(`/manga-reader?volume=${volumeId}`);
    },
    [navigate]
  );

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "addedAt", label: "Date Added" },
    { value: "name", label: "Name" },
    { value: "pageCount", label: "Page Count" },
    { value: "lastReadAt", label: "Last Read" },
  ];

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-10 ${
          isDark ? "bg-gray-800" : "bg-white"
        } shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-pink-500" />
                <h1 className="text-2xl font-bold">Manga Library</h1>
              </div>

              <button
                onClick={() => navigate("/manga-reader")}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New</span>
              </button>
            </div>

            {/* Storage info */}
            <div
              className={`flex items-center gap-6 text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>{storageInfo.formatted} used</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>{storageInfo.volumeCount} volumes</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{storageInfo.pageCount} pages</span>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search volumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <SortAsc className="w-4 h-4" />
                  <span className="text-sm">
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showSortMenu && (
                  <div
                    className={`absolute top-full mt-1 right-0 w-48 rounded-lg shadow-lg border z-20 ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            setSortAsc(!sortAsc);
                          } else {
                            setSortBy(option.value);
                            setSortAsc(false);
                          }
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
                          isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } ${sortBy === option.value ? "text-pink-500" : ""}`}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <span>{sortAsc ? "↑" : "↓"}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div
                className={`flex rounded-lg border overflow-hidden ${
                  isDark ? "border-gray-600" : "border-gray-300"
                }`}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-pink-500 text-white"
                      : isDark
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-pink-500 text-white"
                      : isDark
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Selection actions */}
              {selectedVolumes.size > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedVolumes.size} selected
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              )}

              {/* Delete all button */}
              {volumes.length > 0 && (
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                    isDark
                      ? "text-red-400 hover:bg-red-900/30"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && volumes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen
              className={`w-20 h-20 mb-4 ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            />
            <h2 className="text-xl font-semibold mb-2">
              Your library is empty
            </h2>
            <p
              className={`text-sm mb-6 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Upload a manga volume to get started
            </p>
            <button
              onClick={() => navigate("/manga-reader")}
              className="flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Manga
            </button>
          </div>
        )}

        {/* No search results */}
        {!isLoading && volumes.length > 0 && filteredVolumes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search
              className={`w-16 h-16 mb-4 ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Try a different search term
            </p>
          </div>
        )}

        {/* Grid view */}
        {!isLoading && filteredVolumes.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredVolumes.map((vol) => (
              <div
                key={vol.id}
                className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isDark
                    ? "bg-gray-800 hover:bg-gray-750"
                    : "bg-white hover:shadow-lg"
                } ${selectedVolumes.has(vol.id) ? "ring-2 ring-pink-500" : ""}`}
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(vol.id);
                  }}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedVolumes.has(vol.id)
                      ? "bg-pink-500 border-pink-500 text-white"
                      : isDark
                      ? "bg-gray-800/80 border-gray-500 opacity-0 group-hover:opacity-100"
                      : "bg-white/80 border-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {selectedVolumes.has(vol.id) && <Check className="w-4 h-4" />}
                </button>

                {/* Cover image */}
                <div
                  className={`aspect-[3/4] flex items-center justify-center ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  onClick={() => openVolume(vol.id)}
                >
                  {coverUrls[vol.id] ? (
                    <img
                      src={coverUrls[vol.id]}
                      alt={vol.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderOpen
                      className={`w-12 h-12 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  )}
                </div>

                {/* Info */}
                <div
                  className={`p-3 ${isDark ? "bg-gray-800" : "bg-white"}`}
                  onClick={() => openVolume(vol.id)}
                >
                  <p
                    className={`text-sm font-medium truncate ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                    title={vol.name}
                  >
                    {vol.name.replace(".cbz", "")}
                  </p>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {vol.pageCount} pages
                  </p>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Added {formatDate(vol.addedAt)}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(vol.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* OCR badge */}
                {Object.keys(vol.ocrResults || {}).length > 0 && (
                  <div className="absolute bottom-14 right-2 px-2 py-0.5 rounded text-xs bg-green-500/90 text-white">
                    OCR
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {!isLoading && filteredVolumes.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {/* Header row */}
            <div
              className={`flex items-center gap-4 px-4 py-2 text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <button
                onClick={toggleSelectAll}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                  selectedVolumes.size === filteredVolumes.length &&
                  filteredVolumes.length > 0
                    ? "bg-pink-500 border-pink-500 text-white"
                    : isDark
                    ? "border-gray-500"
                    : "border-gray-400"
                }`}
              >
                {selectedVolumes.size === filteredVolumes.length &&
                  filteredVolumes.length > 0 && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1">Name</div>
              <div className="w-24 text-center">Pages</div>
              <div className="w-32 text-center">Added</div>
              <div className="w-32 text-center">Last Read</div>
              <div className="w-20"></div>
            </div>

            {/* Volume rows */}
            {filteredVolumes.map((vol) => (
              <div
                key={vol.id}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                  isDark
                    ? "bg-gray-800 hover:bg-gray-750"
                    : "bg-white hover:shadow-md"
                } ${selectedVolumes.has(vol.id) ? "ring-2 ring-pink-500" : ""}`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(vol.id);
                  }}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedVolumes.has(vol.id)
                      ? "bg-pink-500 border-pink-500 text-white"
                      : isDark
                      ? "border-gray-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedVolumes.has(vol.id) && <Check className="w-4 h-4" />}
                </button>

                {/* Thumbnail */}
                <div
                  className={`w-12 h-16 rounded overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  onClick={() => openVolume(vol.id)}
                >
                  {coverUrls[vol.id] ? (
                    <img
                      src={coverUrls[vol.id]}
                      alt={vol.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderOpen
                      className={`w-6 h-6 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  )}
                </div>

                {/* Name */}
                <div
                  className="flex-1 min-w-0"
                  onClick={() => openVolume(vol.id)}
                >
                  <p
                    className={`font-medium truncate ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                    title={vol.name}
                  >
                    {vol.name.replace(".cbz", "")}
                  </p>
                  {Object.keys(vol.ocrResults || {}).length > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-green-500/90 text-white">
                      OCR Ready
                    </span>
                  )}
                </div>

                {/* Pages */}
                <div
                  className={`w-24 text-center ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                  onClick={() => openVolume(vol.id)}
                >
                  {vol.pageCount}
                </div>

                {/* Added date */}
                <div
                  className={`w-32 text-center text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                  onClick={() => openVolume(vol.id)}
                >
                  {formatDate(vol.addedAt)}
                </div>

                {/* Last read */}
                <div
                  className={`w-32 text-center text-sm ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}
                  onClick={() => openVolume(vol.id)}
                >
                  {vol.lastReadAt ? formatDate(vol.lastReadAt) : "—"}
                </div>

                {/* Actions */}
                <div className="w-20 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(vol.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "text-red-400 hover:bg-red-900/30"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete single volume modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`max-w-md w-full mx-4 rounded-xl shadow-xl p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Volume?</h3>
            </div>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              This will permanently delete this volume and its OCR data. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete all modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`max-w-md w-full mx-4 rounded-xl shadow-xl p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-semibold">Clear Entire Library?</h3>
            </div>
            <p className={`mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              This will permanently delete{" "}
              <strong>all {volumes.length} volumes</strong> and their OCR data (
              {storageInfo.formatted}).
            </p>
            <p className={`mb-6 text-red-500 font-medium`}>
              This action cannot be undone!
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Delete All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
