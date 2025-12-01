import { create } from "zustand";

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmStore {
  dialog: ConfirmDialog | null;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  hideConfirm: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  dialog: null,
  showConfirm: (
    message: string,
    onConfirm: () => void,
    title: string = "Confirm"
  ) => {
    set({
      dialog: {
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          get().hideConfirm();
        },
        onCancel: () => {
          get().hideConfirm();
        },
      },
    });
  },
  hideConfirm: () => {
    set({ dialog: null });
  },
}));
