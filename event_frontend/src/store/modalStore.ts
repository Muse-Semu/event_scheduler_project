import { create } from "zustand";

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule?: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    interval: number;
    end_date?: string;
    weekdays?: string[] | null;
    weekday?: string | null;
    ordinal?: number | null;
  };
}

interface ModalState {
  isOpen: boolean;
  selectedEvent: Event | null;
  openModal: (event: Event | null) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  selectedEvent: null,
  openModal: (event) => set({ isOpen: true, selectedEvent: event }),
  closeModal: () => set({ isOpen: false, selectedEvent: null }),
}));
