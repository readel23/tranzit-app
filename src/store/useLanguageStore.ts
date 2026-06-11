import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ru' | 'kk';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'tranzit-language-storage',
    }
  )
);
