import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeStore } from "../store/themeStore";
import audio from "../utils/clickSound";

export default function AudioControl() {
  const isDark = useThemeStore((s) => s.isDark);
  const [muted, setMuted] = useState<boolean>(audio.isMuted());

  useEffect(() => {
    // nothing to sync on mount; audio control does minimal setup
  }, []);

  const handleToggle = () => {
    audio.resumeAudioContext();
    const m = audio.toggleMute();
    setMuted(m);
  };

  return (
    <div data-skip-global-sound className="flex items-center space-x-3">
      <button
        onClick={handleToggle}
        aria-label="Toggle audio mute"
        className={`p-2 rounded-md transition-colors focus:outline-none ${
          isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
        }`}
      >
        {muted ? (
          <VolumeX
            className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          />
        ) : (
          <Volume2
            className={`w-5 h-5 ${isDark ? "text-white" : "text-primary-500"}`}
          />
        )}
      </button>
    </div>
  );
}
