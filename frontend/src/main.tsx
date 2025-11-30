import React from "react";
// Ensure A-Frame is loaded globally before any components/scripts that expect `AFRAME`.
// Some third-party components (e.g. aframe-forcegraph-component) assume a global AFRAME
// and may throw `AFRAME is not defined` if it's not present. Importing here guarantees
// the global is available early during app bootstrap.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "aframe";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import audio from "./utils/clickSound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Preload keyboard sounds asynchronously (non-blocking)
(async () => {
  try {
    await audio.initAudio([
      "Keyboard_1",
      "Keyboard_2",
      "Keyboard_3",
      "Keyboard_4",
      "Keyboard_5",
      "Keyboard_6",
      "Keyboard_7",
    ]);
    console.log("Audio buffers loaded");
  } catch (e) {
    console.warn("Audio preload failed", e);
  }
})();

// Global click handler: play a random keyboard sound when interactive elements are clicked.
// Elements that opt-out should include `data-skip-global-sound` attribute.
document.addEventListener(
  "click",
  (event) => {
    try {
      const target = event.target as Element | null;
      if (!target) return;

      // If clicked element is inside an element that wants to skip global sound, do nothing
      if (target.closest && target.closest("[data-skip-global-sound]")) return;

      // Interactive selectors we consider "clickable"
      const interactive = target.closest(
        "button, a[href], [role=button], input[type=button], input[type=submit], label, select, textarea"
      );
      if (interactive) {
        // resume context on user gesture and play a random keyboard sound
        audio.resumeAudioContext();
        audio.playRandom();
      }
    } catch (err) {
      // swallow errors - not critical
    }
  },
  { capture: true }
);
