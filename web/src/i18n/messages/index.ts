import type { Lang } from '../languages'
import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr, type Messages } from './fr'
import { it } from './it'

export type { Messages } from './fr'

export const MESSAGES: Record<Lang, Messages> = { fr, en, es, de, it }
