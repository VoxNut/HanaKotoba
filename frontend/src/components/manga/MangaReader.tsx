/**
 * MangaReader Component - Enhanced Version
 *
 * Features:
 * - CBZ volume upload and storage (IndexedDB)
 * - Two-page spread view (auto-detects double-page spreads)
 * - Hover-to-show text overlay (no click required)
 * - Right-click to add words to flashcard deck
 * - Page number input for direct navigation
 * - Background OCR processing for all pages
 */

import JSZip from "jszip";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Library,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  EnrichedTextBox,
  MangaPageResult,
  processMangaImageEnriched,
} from "../../services/mangaApi";
import { useThemeStore } from "../../store/themeStore";
import TextOverlay from "./TextOverlay";

// IndexedDB for storing volumes
const DB_NAME = "HanaKotobaMangaDB";
const DB_VERSION = 1;
const STORE_NAME = "volumes";

interface StoredVolume {
  id: string;
  name: string;
  uploadedAt: Date;
  pageCount: number;
  pages: Array<{ name: string; data: ArrayBuffer }>;
  ocrResults: Record<number, MangaPageResult>;
  coverImage?: ArrayBuffer;
}

interface PageData {
  name: string;
  data: Blob;
  url?: string;
  ocrResult?: MangaPageResult;
  isProcessing?: boolean;
  isWide?: boolean; // For detecting double-page spreads
}

interface MangaReaderProps {
  onAddToFlashcards?: (
    text: string,
    reading: string,
    translation: string
  ) => void;
  /** Volume ID to load automatically on mount */
  initialVolumeId?: string;
}

// IndexedDB helper functions
async function openDB(): Promise<IDBDatabase> {
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

async function saveVolume(volume: StoredVolume): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(volume);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
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

async function getVolume(id: string): Promise<StoredVolume | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
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

export default function MangaReader({
  onAddToFlashcards,
  initialVolumeId,
}: MangaReaderProps) {
  const isDark = useThemeStore((state) => state.isDark);

  // State
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [hoveredBox, setHoveredBox] = useState<EnrichedTextBox | null>(null);
  const [hoveredPageIndex, setHoveredPageIndex] = useState<number | null>(null);
  const [twoPageMode, setTwoPageMode] = useState(true);
  const [pageInputValue, setPageInputValue] = useState("");
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Library state
  const [showLibrary, setShowLibrary] = useState(false);
  const [storedVolumes, setStoredVolumes] = useState<StoredVolume[]>([]);
  const [currentVolumeName, setCurrentVolumeName] = useState<string | null>(
    null
  );
  const [currentVolumeId, setCurrentVolumeId] = useState<string | null>(null);

  // Track displayed image dimensions for font scaling
  const [displayedImgWidths, setDisplayedImgWidths] = useState<
    Record<number, number>
  >({});

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image load to track displayed dimensions
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>, pageIndex: number) => {
      const img = e.currentTarget;
      setDisplayedImgWidths((prev) => ({
        ...prev,
        [pageIndex]: img.clientWidth,
      }));
    },
    []
  );

  // Load stored volumes on mount
  useEffect(() => {
    loadStoredVolumes();
  }, []);

  // Auto-load initial volume if specified
  useEffect(() => {
    if (initialVolumeId && storedVolumes.length > 0 && pages.length === 0) {
      const volumeExists = storedVolumes.some((v) => v.id === initialVolumeId);
      if (volumeExists) {
        loadVolumeFromLibrary(initialVolumeId);
      }
    }
  }, [initialVolumeId, storedVolumes]);

  const loadStoredVolumes = async () => {
    try {
      const volumes = await getVolumes();
      setStoredVolumes(volumes);
    } catch (err) {
      console.error("Failed to load volumes:", err);
    }
  };

  // Detect if a page is a double-page spread
  const detectWidePages = useCallback(async (pageData: PageData[]) => {
    const updatedPages = await Promise.all(
      pageData.map(async (page) => {
        return new Promise<PageData>((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(page.data);
          img.onload = () => {
            const isWide = img.width > img.height * 1.3;
            URL.revokeObjectURL(url);
            resolve({ ...page, isWide });
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ ...page, isWide: false });
          };
          img.src = url;
        });
      })
    );
    return updatedPages;
  }, []);

  // Process all pages with OCR in background
  const processAllPages = useCallback(
    async (pageData: PageData[], volumeId?: string) => {
      const total = pageData.length;
      setProcessingProgress({ current: 0, total });

      const ocrResults: Record<number, MangaPageResult> = {};

      for (let i = 0; i < pageData.length; i++) {
        try {
          const file = new File([pageData[i].data], pageData[i].name, {
            type: "image/*",
          });
          const result = await processMangaImageEnriched(
            file,
            includeTranslation
          );

          ocrResults[i] = result;

          setPages((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, ocrResult: result, isProcessing: false } : p
            )
          );

          setProcessingProgress({ current: i + 1, total });
        } catch (err) {
          console.error(`Failed to process page ${i}:`, err);
          setPages((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, isProcessing: false } : p
            )
          );
        }
      }

      // Save OCR results to stored volume
      if (volumeId) {
        try {
          const volume = await getVolume(volumeId);
          if (volume) {
            volume.ocrResults = ocrResults;
            await saveVolume(volume);
          }
        } catch (err) {
          console.error("Failed to save OCR results:", err);
        }
      }

      setProcessingProgress(null);
    },
    [includeTranslation]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setHoveredBox(null);
      setPages([]);
      setCurrentPageIndex(0);

      try {
        if (
          file.type === "application/zip" ||
          file.type === "application/x-cbz" ||
          file.name.endsWith(".cbz")
        ) {
          const zip = new JSZip();
          const zipData = await zip.loadAsync(file);

          const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
          const pageData: PageData[] = [];

          const fileNames = Object.keys(zipData.files).sort();

          for (const fileName of fileNames) {
            const fileEntry = zipData.files[fileName];
            if (fileEntry.dir) continue;

            const ext = fileName.substring(fileName.lastIndexOf("."));
            if (imageExtensions.includes(ext.toLowerCase())) {
              const blob = await fileEntry.async("blob");
              pageData.push({
                name: fileName,
                data: blob,
                isProcessing: true,
              });
            }
          }

          if (pageData.length === 0) {
            setError("No images found in the CBZ file.");
            setIsLoading(false);
            return;
          }

          // Detect wide pages
          const pagesWithWideDetection = await detectWidePages(pageData);

          // Create object URLs for display
          const pagesWithUrls = pagesWithWideDetection.map((p) => ({
            ...p,
            url: URL.createObjectURL(p.data),
          }));

          setPages(pagesWithUrls);
          setCurrentVolumeName(file.name);
          setIsLoading(false);

          // Generate volume ID
          const volumeId = `vol_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          setCurrentVolumeId(volumeId);

          // Save volume to IndexedDB
          const pagesForStorage = await Promise.all(
            pagesWithWideDetection.map(async (p) => ({
              name: p.name,
              data: await p.data.arrayBuffer(),
            }))
          );

          const coverBlob = pagesWithWideDetection[0]?.data;
          const coverImage = coverBlob
            ? await coverBlob.arrayBuffer()
            : undefined;

          const storedVolume: StoredVolume = {
            id: volumeId,
            name: file.name,
            uploadedAt: new Date(),
            pageCount: pagesWithWideDetection.length,
            pages: pagesForStorage,
            ocrResults: {},
            coverImage,
          };

          await saveVolume(storedVolume);
          await loadStoredVolumes();

          // Process all pages in background
          processAllPages(pagesWithUrls, volumeId);
        } else if (file.type.startsWith("image/")) {
          const blob = file;
          const pageData: PageData = {
            name: file.name,
            data: blob,
            url: URL.createObjectURL(blob),
            isProcessing: true,
          };

          // Detect if wide
          const [pageWithWide] = await detectWidePages([pageData]);
          pageWithWide.url = URL.createObjectURL(pageWithWide.data);

          setPages([pageWithWide]);
          setCurrentVolumeName(file.name);
          setIsLoading(false);

          processAllPages([pageWithWide]);
        } else {
          setError("Please upload an image file or a CBZ file");
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error("Failed to process file:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process file";
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [detectWidePages, processAllPages]
  );

  // Load volume from library
  const loadVolumeFromLibrary = useCallback(
    async (volumeId: string) => {
      setIsLoading(true);
      setError(null);
      setShowLibrary(false);

      try {
        const volume = await getVolume(volumeId);
        if (!volume) {
          setError("Volume not found");
          setIsLoading(false);
          return;
        }

        const pageData: PageData[] = volume.pages.map((p, idx) => {
          const blob = new Blob([p.data]);
          return {
            name: p.name,
            data: blob,
            url: URL.createObjectURL(blob),
            ocrResult: volume.ocrResults[idx],
            isProcessing: !volume.ocrResults[idx],
          };
        });

        // Detect wide pages
        const pagesWithWide = await detectWidePages(pageData);
        const pagesWithUrls = pagesWithWide.map((p, idx) => ({
          ...p,
          url: pageData[idx].url,
          ocrResult: pageData[idx].ocrResult,
          isProcessing: pageData[idx].isProcessing,
        }));

        setPages(pagesWithUrls);
        setCurrentPageIndex(0);
        setCurrentVolumeName(volume.name);
        setCurrentVolumeId(volumeId);
        setIsLoading(false);

        // Process remaining pages that don't have OCR results
        const pagesToProcess = pagesWithUrls.filter((p) => !p.ocrResult);
        if (pagesToProcess.length > 0) {
          processAllPages(pagesWithUrls, volumeId);
        }
      } catch (err) {
        console.error("Failed to load volume:", err);
        setError("Failed to load volume");
        setIsLoading(false);
      }
    },
    [detectWidePages, processAllPages]
  );

  // Delete volume from library
  const handleDeleteVolume = useCallback(
    async (volumeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (
        !confirm(
          "Are you sure you want to delete this volume from the library?"
        )
      )
        return;

      try {
        await deleteVolume(volumeId);
        await loadStoredVolumes();

        if (currentVolumeId === volumeId) {
          setPages([]);
          setCurrentVolumeName(null);
          setCurrentVolumeId(null);
        }
      } catch (err) {
        console.error("Failed to delete volume:", err);
      }
    },
    [currentVolumeId]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Navigate to specific page
  const goToPage = useCallback(
    (pageNum: number) => {
      const index = Math.max(0, Math.min(pages.length - 1, pageNum - 1));
      setCurrentPageIndex(index);
      setHoveredBox(null);
    },
    [pages.length]
  );

  const handlePageInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const pageNum = parseInt(pageInputValue, 10);
      if (!isNaN(pageNum)) {
        goToPage(pageNum);
        setPageInputValue("");
      }
    },
    [pageInputValue, goToPage]
  );

  // Page navigation
  const handlePreviousPage = useCallback(() => {
    if (currentPageIndex === 0) return;
    const step = twoPageMode && !pages[currentPageIndex - 1]?.isWide ? 2 : 1;
    setCurrentPageIndex(Math.max(0, currentPageIndex - step));
    setHoveredBox(null);
  }, [currentPageIndex, twoPageMode, pages]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex >= pages.length - 1) return;
    const currentPage = pages[currentPageIndex];
    const step = twoPageMode && !currentPage?.isWide ? 2 : 1;
    setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + step));
    setHoveredBox(null);
  }, [currentPageIndex, pages, twoPageMode]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  // Clear current
  const handleClear = () => {
    pages.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPages([]);
    setCurrentPageIndex(0);
    setHoveredBox(null);
    setError(null);
    setCurrentVolumeName(null);
    setCurrentVolumeId(null);
  };

  // Get pages to display (1 or 2 depending on mode)
  const getDisplayPages = useCallback(() => {
    if (pages.length === 0) return [];

    const currentPage = pages[currentPageIndex];
    if (!currentPage) return [];

    // If current page is wide (double-page spread), show only one
    if (currentPage.isWide || !twoPageMode) {
      return [{ page: currentPage, index: currentPageIndex }];
    }

    // Two-page mode: show current and next (if not wide)
    const nextIndex = currentPageIndex + 1;
    const nextPage = pages[nextIndex];

    if (nextPage && !nextPage.isWide) {
      return [
        { page: currentPage, index: currentPageIndex },
        { page: nextPage, index: nextIndex },
      ];
    }

    return [{ page: currentPage, index: currentPageIndex }];
  }, [pages, currentPageIndex, twoPageMode]);

  // Handle text box hover - set the hovered box and page index
  const handleBoxHover = useCallback(
    (box: EnrichedTextBox | null, pageIndex: number | null) => {
      setHoveredBox(box);
      setHoveredPageIndex(pageIndex);
    },
    []
  );

  // Direct leave handler - clears immediately when leaving page container
  const handleBoxLeave = useCallback(() => {
    setHoveredBox(null);
    setHoveredPageIndex(null);
  }, []);

  // Handle right-click to add to flashcards
  const handleContextMenu = useCallback(
    (box: EnrichedTextBox, e: React.MouseEvent) => {
      e.preventDefault();
      if (
        onAddToFlashcards &&
        box.pitch_accent &&
        box.pitch_accent.length > 0
      ) {
        const reading = box.pitch_accent.map((p) => p.reading).join("");
        onAddToFlashcards(box.text, reading, box.translation || "");
      }
    },
    [onAddToFlashcards]
  );

  const displayPages = getDisplayPages();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between p-3 border-b flex-wrap gap-2 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? "bg-primary-600 hover:bg-primary-500 text-white"
                : "bg-primary-500 hover:bg-primary-600 text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.cbz"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFileUpload(e.target.files[0])
            }
          />

          {/* Library Button */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showLibrary
                ? "bg-primary-600 text-white"
                : isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Library className="w-4 h-4" />
            Library ({storedVolumes.length})
          </button>

          {pages.length > 0 && (
            <>
              {/* Page Navigation */}
              <div
                className={`flex items-center gap-1 ml-2 pl-2 border-l ${
                  isDark ? "border-gray-600" : "border-gray-300"
                }`}
              >
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPageIndex === 0}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPageIndex === 0
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page indicator and input */}
                <form
                  onSubmit={handlePageInputSubmit}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={pageInputValue}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    placeholder={String(currentPageIndex + 1)}
                    className={`w-12 text-center text-sm py-1 rounded border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <span
                    className={`mx-1 text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    / {pages.length}
                  </span>
                </form>

                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex >= pages.length - 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPageIndex >= pages.length - 1
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Two-page mode toggle */}
              <label className="flex items-center gap-2 text-sm ml-2">
                <input
                  type="checkbox"
                  checked={twoPageMode}
                  onChange={(e) => setTwoPageMode(e.target.checked)}
                  className="rounded"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                  2-Page
                </span>
              </label>

              <button
                onClick={handleClear}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Right side controls */}
        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Processing progress */}
            {processingProgress && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  OCR: {processingProgress.current}/{processingProgress.total}
                </span>
              </div>
            )}

            {/* Translation toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeTranslation}
                onChange={(e) => setIncludeTranslation(e.target.checked)}
                className="rounded"
              />
              <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                Translations
              </span>
            </label>

            {/* Zoom controls */}
            <div
              className={`flex items-center gap-1 ml-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <button
                onClick={handleZoomOut}
                className={`p-1.5 rounded transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className={`p-1.5 rounded transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomReset}
                className={`p-1.5 rounded transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Library Panel */}
      {showLibrary && (
        <div
          className={`p-4 border-b ${
            isDark
              ? "bg-gray-850 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Saved Volumes
          </h3>
          {storedVolumes.length === 0 ? (
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              No volumes saved yet. Upload a CBZ file to add it to your library.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {storedVolumes.map((vol) => (
                <div
                  key={vol.id}
                  onClick={() => loadVolumeFromLibrary(vol.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border transition-all hover:scale-105 ${
                    currentVolumeId === vol.id
                      ? "border-primary-500 ring-2 ring-primary-500"
                      : isDark
                      ? "border-gray-700 hover:border-gray-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Cover image */}
                  <div
                    className={`aspect-[3/4] flex items-center justify-center ${
                      isDark ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    {vol.coverImage ? (
                      <img
                        src={URL.createObjectURL(new Blob([vol.coverImage]))}
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
                  <div className={`p-2 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    <p
                      className={`text-sm font-medium truncate ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
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
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteVolume(vol.id, e)}
                    className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto relative ${
          isDark ? "bg-gray-900" : "bg-gray-100"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Empty State */}
        {pages.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`text-center p-12 border-2 border-dashed rounded-2xl max-w-md ${
                isDark
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Upload a Manga Volume
              </h3>
              <p className="text-sm mb-4">
                Drag and drop a CBZ file here, or click Upload.
              </p>
              <p className="text-xs opacity-75">
                Your volumes are saved locally for quick access.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Loading volume...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Manga Pages */}
        {displayPages.length > 0 && (
          <div
            className="flex justify-center items-start p-4 gap-1"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            {/* Right-to-left reading order (manga style) */}
            {[...displayPages].reverse().map(({ page, index }) => (
              <div
                key={index}
                className="relative inline-block"
                onMouseLeave={handleBoxLeave}
              >
                <img
                  src={page.url}
                  alt={`Page ${index + 1}`}
                  className="max-h-[85vh] w-auto"
                  draggable={false}
                  onLoad={(e) => handleImageLoad(e, index)}
                />

                {/* Text Box Overlays - sort by area (smallest on top for better hover) */}
                {page.ocrResult?.text_boxes
                  .slice()
                  .sort((a, b) => {
                    // Sort by area descending - larger boxes render first (behind)
                    const areaA = a.width * a.height;
                    const areaB = b.width * b.height;
                    return areaB - areaA;
                  })
                  .map((box) => (
                    <TextOverlay
                      key={`${index}_${box.id}`}
                      box={box}
                      isHovered={
                        hoveredBox?.id === box.id && hoveredPageIndex === index
                      }
                      onMouseEnter={() => handleBoxHover(box, index)}
                      onMouseLeave={handleBoxLeave}
                      onContextMenu={(e) => handleContextMenu(box, e)}
                      originalImgWidth={page.ocrResult?.img_width}
                      displayedImgWidth={displayedImgWidths[index]}
                    />
                  ))}

                {/* Page processing indicator */}
                {page.isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      {currentVolumeName && (
        <div
          className={`flex items-center justify-between px-4 py-2 text-sm border-t ${
            isDark
              ? "bg-gray-800 border-gray-700 text-gray-400"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          <span className="truncate">{currentVolumeName}</span>
          <span>
            {displayPages.length > 0 &&
              `${
                displayPages[0].page.ocrResult?.text_boxes.length ?? 0
              } text regions`}
          </span>
        </div>
      )}
    </div>
  );
}
