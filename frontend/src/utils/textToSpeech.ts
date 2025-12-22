// Text-to-Speech utility using Web Speech API

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
}

class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Get Japanese voices specifically
   */
  getJapaneseVoices(): VoiceOption[] {
    const voices = this.getVoices();
    return voices
      .filter((voice) => voice.lang.startsWith("ja"))
      .map((voice) => ({
        voice,
        name: voice.name,
        lang: voice.lang,
      }));
  }

  /**
   * Get English voices
   */
  getEnglishVoices(): VoiceOption[] {
    const voices = this.getVoices();
    return voices
      .filter((voice) => voice.lang.startsWith("en"))
      .map((voice) => ({
        voice,
        name: voice.name,
        lang: voice.lang,
      }));
  }

  /**
   * Get all voices grouped by language
   */
  getAllVoicesGrouped(): { language: string; voices: VoiceOption[] }[] {
    const voices = this.getVoices();
    const grouped = voices.reduce((acc, voice) => {
      const lang = voice.lang.split("-")[0];
      if (!acc[lang]) {
        acc[lang] = [];
      }
      acc[lang].push({
        voice,
        name: voice.name,
        lang: voice.lang,
      });
      return acc;
    }, {} as Record<string, VoiceOption[]>);

    return Object.entries(grouped).map(([language, voices]) => ({
      language,
      voices,
    }));
  }

  /**
   * Speak text with specified options
   */
  speak(
    text: string,
    options: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
      lang?: string;
      onEnd?: () => void;
      onError?: (error: any) => void;
    } = {}
  ): void {
    // Cancel any ongoing speech
    this.cancel();

    this.utterance = new SpeechSynthesisUtterance(text);

    if (options.voice) {
      this.utterance.voice = options.voice;
    }
    if (options.rate !== undefined) {
      this.utterance.rate = options.rate;
    }
    if (options.pitch !== undefined) {
      this.utterance.pitch = options.pitch;
    }
    if (options.volume !== undefined) {
      this.utterance.volume = options.volume;
    }
    if (options.lang) {
      this.utterance.lang = options.lang;
    }

    if (options.onEnd) {
      this.utterance.onend = options.onEnd;
    }
    if (options.onError) {
      this.utterance.onerror = options.onError;
    }

    this.synthesis.speak(this.utterance);
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Cancel ongoing speech
   */
  cancel(): void {
    this.synthesis.cancel();
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Generate audio blob from text (for download)
   */
  async generateAudioBlob(
    text: string,
    options: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
    } = {}
  ): Promise<Blob> {
    // Note: Web Speech API doesn't directly support audio recording
    // This is a workaround using MediaRecorder
    return new Promise((resolve, reject) => {
      try {
        // Create an audio context for recording
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();

        const mediaRecorder = new MediaRecorder(dest.stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          audioContext.close();
          resolve(blob);
        };

        mediaRecorder.start();

        // Speak the text
        this.speak(text, {
          ...options,
          onEnd: () => {
            setTimeout(() => {
              mediaRecorder.stop();
            }, 100);
          },
          onError: (error) => {
            mediaRecorder.stop();
            audioContext.close();
            reject(error);
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Download spoken text as audio file
   */
  async downloadAsAudio(
    text: string,
    filename: string = "speech.webm",
    options: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
    } = {}
  ): Promise<void> {
    try {
      const blob = await this.generateAudioBlob(text, options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download audio:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const ttsService = new TextToSpeechService();

// Helper to wait for voices to load
export const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = ttsService.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voiceschanged event
    const handleVoicesChanged = () => {
      const newVoices = ttsService.getVoices();
      if (newVoices.length > 0) {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
        resolve(newVoices);
      }
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );

    // Fallback timeout
    setTimeout(() => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
      resolve(ttsService.getVoices());
    }, 3000);
  });
};
