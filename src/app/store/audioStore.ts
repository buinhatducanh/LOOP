/**
 * Audio Store — Global audio state for LOOP Solutions
 *
 * Manages background music playback state across the site.
 * Used by: OnboardingClient, SiteHeader.
 *
 * Persists muted preference to localStorage.
 */

import { create } from "zustand";

interface AudioStore {
  muted: boolean;
  audioElement: HTMLAudioElement | null;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setAudioElement: (el: HTMLAudioElement | null) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Always start with false on server AND first render to avoid hydration mismatch.
  // The actual localStorage value is applied after mount via setMuted call.
  muted: false,
  audioElement: null,

  setMuted: (muted) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("loop-audio-muted", String(muted));
    }
    const el = get().audioElement;
    if (el) {
      muted ? (el.muted = true) : (el.muted = false);
    }
    set({ muted });
  },

  toggleMuted: () => {
    get().setMuted(!get().muted);
  },

  setAudioElement: (audioElement) => {
    const { muted } = get();
    if (audioElement) {
      audioElement.muted = muted;
    }
    set({ audioElement });
  },
}));
