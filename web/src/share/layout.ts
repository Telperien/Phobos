/** Width of a text at a font size, in pixels (the canvas measures it; tests fake it). */
export type Measure = (text: string, size?: number) => number

/** Splits a text into lines no wider than `maxWidth`; a word too long for any line gets a line of its own. */
export function wrapLines(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && measure(candidate) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  return line ? [...lines, line] : lines
}

/** The largest font size, between the two bounds, at which the text fits the width. */
export function fitFontSize(
  text: string,
  maxWidth: number,
  sizes: { largest: number; smallest: number },
  measure: Measure,
): number {
  let size = sizes.largest
  while (size > sizes.smallest && measure(text, size) > maxWidth) size -= 1
  return size
}
