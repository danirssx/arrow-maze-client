import { create } from "zustand";

type HomeUiState = {
  isArchitectureNoteVisible: boolean;
  toggleArchitectureNote: () => void;
};

export const useHomeUiStore = create<HomeUiState>((set) => ({
  isArchitectureNoteVisible: true,
  toggleArchitectureNote: () =>
    set((state) => ({
      isArchitectureNoteVisible: !state.isArchitectureNoteVisible
    }))
}));
