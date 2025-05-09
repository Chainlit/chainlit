import { create } from 'zustand';

interface ThreadState {
  idToResume?: string;
  resumeThreadError?: string;
  currentThreadId?: string;

  setState: (state: Partial<ThreadState>) => void;
  setIdToResume: (idToResume?: string) => void;
  setCurrentThreadId: (currentThreadId?: string) => void;
  setResumeThreadError: (resumeThreadError?: string) => void;
}

export const useThreadStore = create<ThreadState>((set) => ({
  setState: (state) => set(state),
  setIdToResume: (idToResume) => set({ idToResume }),
  setCurrentThreadId: (currentThreadId) => set({ currentThreadId }),
  setResumeThreadError: (resumeThreadError) => set({ resumeThreadError })
}));
