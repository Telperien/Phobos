import { fitFontSize, type Measure, wrapLines } from './layout'

/** Portrait 4:5: shows whole in feeds and messaging apps. */
export const CARD = { width: 1080, height: 1350 }

export interface VerdictCardData {
  caseFile: string
  category: string
  name: string
  etymology: string
  verdict: string
  tone: 'safe' | 'alarm'
  detail: string
  reached: string
  footer: string
  host: string
  /** Level 1 image of the case file, if it has one. */
  imageSource?: string
}

const COLORS = { ink: '#0b0b0a', paper: '#d8cdb4', paperDark: '#b9ab8c', rust: '#8c2a1c', olive: '#55611f' }
const FONTS = {
  display: (size: number) => `900 ${size}px "Big Shoulders Variable", "Arial Narrow", sans-serif`,
  serif: (size: number) => `400 ${size}px "Newsreader Variable", Georgia, serif`,
  italic: (size: number) => `italic 400 ${size}px "Newsreader Variable", Georgia, serif`,
  mono: (size: number) => `600 ${size}px "IBM Plex Mono", monospace`,
}

const PAPER = { x: 60, y: 90, width: 960, height: 1210 }
const INNER = { x: PAPER.x + 50, width: PAPER.width - 100 }

async function loadFonts() {
  await Promise.all(
    [FONTS.display(100), FONTS.serif(36), FONTS.italic(36), FONTS.mono(26)].map((font) =>
      document.fonts.load(font).catch(() => []),
    ),
  )
}

async function loadImage(source: string | undefined) {
  if (!source) return null
  const image = new Image()
  image.src = source
  try {
    await image.decode()
    return image
  } catch {
    return null
  }
}

const measureWith =
  (ctx: CanvasRenderingContext2D, font: (size: number) => string, defaultSize: number): Measure =>
  (text, size = defaultSize) => {
    ctx.font = font(size)
    return ctx.measureText(text).width
  }

function drawPaper(ctx: CanvasRenderingContext2D, caseFile: string) {
  ctx.fillStyle = COLORS.ink
  ctx.fillRect(0, 0, CARD.width, CARD.height)
  ctx.fillStyle = COLORS.paperDark
  ctx.fillRect(PAPER.x, PAPER.y - 50, 380, 60)
  ctx.fillStyle = COLORS.ink
  ctx.font = FONTS.mono(26)
  ctx.fillText(caseFile, PAPER.x + 24, PAPER.y - 12)

  ctx.fillStyle = COLORS.paper
  ctx.fillRect(PAPER.x, PAPER.y, PAPER.width, PAPER.height)
  const stain = ctx.createRadialGradient(900, 1180, 40, 900, 1180, 520)
  stain.addColorStop(0, 'rgba(90, 60, 30, 0.22)')
  stain.addColorStop(1, 'rgba(90, 60, 30, 0)')
  ctx.fillStyle = stain
  ctx.fillRect(PAPER.x, PAPER.y, PAPER.width, PAPER.height)
}

function drawImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, y: number) {
  const height = 470
  const scale = Math.max(INNER.width / image.naturalWidth, height / image.naturalHeight)
  const sw = INNER.width / scale
  const sh = height / scale
  ctx.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    INNER.x,
    y,
    INNER.width,
    height,
  )
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 3
  ctx.strokeRect(INNER.x, y, INNER.width, height)
  return y + height
}

function drawStamp(ctx: CanvasRenderingContext2D, text: string, color: string, y: number) {
  const size = fitFontSize(text, 640, { largest: 110, smallest: 54 }, measureWith(ctx, FONTS.display, 110))
  ctx.font = FONTS.display(size)
  const width = ctx.measureText(text).width
  ctx.save()
  ctx.translate(INNER.x + 30, y)
  ctx.rotate((-5 * Math.PI) / 180)
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  ctx.strokeRect(-24, -size * 0.92, width + 48, size * 1.15)
  ctx.fillStyle = color
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

/** Draws the verdict card and returns it as a PNG. */
export async function renderVerdictCard(data: VerdictCardData): Promise<Blob> {
  const [, image] = await Promise.all([loadFonts(), loadImage(data.imageSource)])
  const canvas = document.createElement('canvas')
  canvas.width = CARD.width
  canvas.height = CARD.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  drawPaper(ctx, data.caseFile)

  ctx.fillStyle = 'rgba(11, 11, 10, 0.6)'
  ctx.font = FONTS.mono(24)
  ctx.fillText(data.category.toUpperCase(), INNER.x, PAPER.y + 62)
  ctx.textAlign = 'right'
  ctx.fillText('PHOBOS', INNER.x + INNER.width, PAPER.y + 62)
  ctx.textAlign = 'left'
  ctx.fillRect(INNER.x, PAPER.y + 80, INNER.width, 2)

  let y = PAPER.y + 110
  if (image) y = drawImage(ctx, image, y) + 30

  const name = data.name.toUpperCase()
  const nameSize = fitFontSize(
    name,
    INNER.width,
    { largest: 150, smallest: 60 },
    measureWith(ctx, FONTS.display, 150),
  )
  y += nameSize * 0.85
  ctx.fillStyle = COLORS.ink
  ctx.font = FONTS.display(nameSize)
  ctx.fillText(name, INNER.x, y)

  y += 50
  ctx.fillStyle = 'rgba(11, 11, 10, 0.7)'
  ctx.font = FONTS.italic(32)
  ctx.fillText(data.etymology, INNER.x, y, INNER.width)

  y += image ? 175 : 240
  drawStamp(ctx, data.verdict.toUpperCase(), data.tone === 'safe' ? COLORS.olive : COLORS.rust, y)

  y += 90
  ctx.fillStyle = 'rgba(11, 11, 10, 0.85)'
  ctx.font = FONTS.serif(36)
  for (const line of wrapLines(data.detail, INNER.width, measureWith(ctx, FONTS.serif, 36)).slice(0, 3)) {
    ctx.fillText(line, INNER.x, y)
    y += 48
  }

  const bottom = PAPER.y + PAPER.height - 40
  ctx.fillStyle = 'rgba(11, 11, 10, 0.25)'
  ctx.fillRect(INNER.x, bottom - 70, INNER.width, 2)
  ctx.fillStyle = COLORS.rust
  ctx.font = FONTS.mono(26)
  ctx.fillText(data.reached, INNER.x, bottom - 24)
  ctx.fillStyle = 'rgba(11, 11, 10, 0.6)'
  ctx.textAlign = 'right'
  ctx.fillText(data.host, INNER.x + INNER.width, bottom - 24)
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.paper
  ctx.font = FONTS.mono(24)
  ctx.fillText(data.footer, PAPER.x, CARD.height - 18)

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'),
  )
}
