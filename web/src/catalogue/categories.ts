export const CATEGORIES = [
  { code: 'animals', label: 'Animaux' },
  { code: 'nature-and-spaces', label: 'Nature & espaces' },
  { code: 'body-and-health', label: 'Corps & santé' },
  { code: 'strange', label: 'Étrange' },
] as const

export const categoryLabel = (code: string) =>
  CATEGORIES.find((category) => category.code === code)?.label ?? code
