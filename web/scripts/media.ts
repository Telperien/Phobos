/**
 * Prepares the case file images: media-src/<slug>/<level>-<letter>.<png|jpg|jpeg|webp|avif>
 * becomes media/<slug>/<level>-<letter>.webp (1600 px at most, metadata removed).
 *
 *   npm run media                 check and convert
 *   npm run media -- --declare-ai also declare the undeclared sources as AI-generated images
 *
 * Stops with an error when a declared image has no source (or two), or when an image found on the web
 * lacks its licence or its address.
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { type DeclaredImage, declareGenerated, hasErrors, type MediaPlan, planMedia } from './media-plan.ts'

const root = process.env.PHOBOS_ROOT ?? path.resolve(import.meta.dirname, '..', '..')
const contentDir = path.join(root, 'content', 'phobias')
const sourceDir = path.join(root, 'media-src')
const preparedDir = path.join(root, 'media')

interface ContentFile {
  slug: string
  images: DeclaredImage[]
}

async function listFiles(dir: string): Promise<Map<string, number>> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
  const files = new Map<string, number>()
  for (const entry of entries.filter((candidate) => candidate.isFile())) {
    const full = path.join(entry.parentPath, entry.name)
    files.set(path.relative(dir, full).split(path.sep).join('/'), (await stat(full)).mtimeMs)
  }
  return files
}

async function readContent(): Promise<Map<string, ContentFile>> {
  const contents = new Map<string, ContentFile>()
  for (const name of (await readdir(contentDir)).filter((file) => file.endsWith('.json'))) {
    const content = JSON.parse(await readFile(path.join(contentDir, name), 'utf8'))
    contents.set(name, { ...content, images: content.images ?? [] })
  }
  return contents
}

async function plan(contents: Map<string, ContentFile>): Promise<MediaPlan> {
  const phobias = [...contents.values()].map(({ slug, images }) => ({ slug, images }))
  return planMedia(phobias, { sources: await listFiles(sourceDir), prepared: await listFiles(preparedDir) })
}

async function declareUndeclared(contents: Map<string, ContentFile>, undeclared: MediaPlan['undeclared']) {
  for (const [name, content] of contents) {
    const suggestions = undeclared.flatMap(({ suggestion }) =>
      suggestion?.slug === content.slug ? [suggestion] : [],
    )
    if (suggestions.length === 0) continue
    await writeFile(
      path.join(contentDir, name),
      `${JSON.stringify(declareGenerated(content, suggestions), null, 2)}\n`,
    )
    console.log(`Déclarées comme images IA dans ${name} : ${suggestions.map(({ file }) => file).join(', ')}`)
  }
}

async function convert({ source, target }: MediaPlan['convert'][number]) {
  const output = path.join(preparedDir, target)
  await mkdir(path.dirname(output), { recursive: true })
  await sharp(path.join(sourceDir, source))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(output)
  console.log(`Préparée : ${target}`)
}

function report(result: MediaPlan) {
  const list = (title: string, items: string[]) => {
    if (items.length > 0) console.error(`${title} :\n${items.map((item) => `  - ${item}`).join('\n')}`)
  }
  list('Image déclarée sans source dans media-src', result.missing)
  list('Image déclarée avec plusieurs sources (garder un seul format)', result.ambiguous)
  list('Image du web sans licence ou sans adresse d’origine', result.uncredited)
  for (const { source, suggestion } of result.undeclared) {
    console.warn(
      suggestion
        ? `Non déclarée : ${source} → ajouter { "level": ${suggestion.level}, "file": "${suggestion.file}", "origin": "ai" } (ou relancer avec --declare-ai)`
        : `Non déclarée : ${source} (nom attendu : <slug>/<niveau 1 à 4>-<lettre>.<format>)`,
    )
  }
}

const contents = await readContent()
let result = await plan(contents)
if (process.argv.includes('--declare-ai')) {
  await declareUndeclared(contents, result.undeclared)
  result = await plan(await readContent())
}

report(result)
if (hasErrors(result)) {
  console.error('Rien n’a été converti : corriger les erreurs ci-dessus.')
  process.exit(1)
}
for (const item of result.convert) await convert(item)
console.log(`${result.convert.length} préparée(s), ${result.upToDate.length} déjà à jour.`)
