import { useSyncExternalStore } from 'react'
import { cityTitles, strings, type Lang, type Strings } from './strings'

const storageKey = 'github-city-lang'

// Spanish by default; English via the ES/EN switch (remembered) or a ?lang=en link.
const initialLang = (): Lang => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'en' || fromUrl === 'es') {
      return fromUrl
    }
    return window.localStorage.getItem(storageKey) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

let current: Lang = typeof window === 'undefined' ? 'es' : initialLang()
const listeners = new Set<() => void>()

export const setLang = (lang: Lang): void => {
  current = lang
  try {
    window.localStorage.setItem(storageKey, lang)
  } catch {
    // Private mode or blocked storage: the choice just won't be remembered.
  }
  document.documentElement.lang = lang
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useLang = (): Lang => useSyncExternalStore(subscribe, () => current, () => 'es')

export const useStrings = (): Strings => strings[useLang()]

export const useCityTitle = (title: string): string => (useLang() === 'en' ? cityTitles[title] ?? title : title)
