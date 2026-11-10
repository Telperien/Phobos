/**
 * Checks that every level 5 YouTube video still exists and can still be embedded.
 *
 *   npm run videos     (also run every Monday by .github/workflows/videos.yml)
 *
 * Exits with an error naming the phobias whose video must be replaced. Needs no npm package.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { reportVideos, statusFromOembed, type VideoResult } from './video-check.ts'

const root = process.env.PHOBOS_ROOT ?? path.resolve(import.meta.dirname, '..', '..')
const contentDir = path.join(root, 'content', 'phobias')

async function check(videoId: string) {
  const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${watch}&format=json`)
    return statusFromOembed(response.status)
  } catch {
    return statusFromOembed(0)
  }
}

const results: VideoResult[] = []
for (const name of (await readdir(contentDir)).filter((file) => file.endsWith('.json')).sort()) {
  const content = JSON.parse(await readFile(path.join(contentDir, name), 'utf8'))
  if (!content.video?.youtube) continue
  results.push({
    slug: content.slug,
    videoId: content.video.youtube,
    status: await check(content.video.youtube),
  })
}

const report = reportVideos(results)
for (const line of report.lines) (report.failed ? console.error : console.log)(line)
if (report.failed) process.exitCode = 1
