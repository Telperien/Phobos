/** Category codes as served by the API. Labels live in the messages (`categories`). */
export const CATEGORY_CODES = ['animals', 'nature-and-spaces', 'body-and-health', 'strange'] as const
export type CategoryCode = (typeof CATEGORY_CODES)[number]

export const isCategoryCode = (code: unknown): code is CategoryCode =>
  CATEGORY_CODES.includes(code as CategoryCode)

/** Label of a category in the current messages; an unknown code is shown as is. */
export const categoryName = (categories: Record<CategoryCode, string>, code: string) =>
  isCategoryCode(code) ? categories[code] : code
