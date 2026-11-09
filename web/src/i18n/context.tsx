import { createContext, type ReactNode, useContext } from 'react'
import type { Lang } from './languages'
import { MESSAGES } from './messages'

/** French outside any provider: the language the interface was written in (and the one tests read). */
const LangContext = createContext<Lang>('fr')

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

/** Messages of the current interface language. */
export const useT = () => MESSAGES[useLang()]
