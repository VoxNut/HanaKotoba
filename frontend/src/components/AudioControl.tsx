import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import audio from "../utils/clickSound";

export default function AudioControl() {
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
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {muted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-red-500" />
        )}
      </button>
    </div>
  );
}
