/** The parts of `navigator` that sharing needs (absent on most desktop browsers). */
export interface ShareTarget {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Sends the verdict card through the device's share sheet (phones: messaging apps, social networks),
 * or downloads it when the browser cannot share files.
 */
export async function shareCard(
  card: { file: File; title: string; text: string; url: string },
  target: ShareTarget,
  download: (file: File) => void,
): Promise<ShareOutcome> {
  const data = { files: [card.file], title: card.title, text: card.text, url: card.url }
  if (target.share && target.canShare?.({ files: data.files })) {
    try {
      await target.share(data)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  download(card.file)
  return 'downloaded'
}
