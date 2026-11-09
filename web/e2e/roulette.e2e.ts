import { expect, type Page, test } from '@playwright/test'

const caseFileName = (page: Page) => page.getByRole('heading', { level: 1 })

/** Marks every case file as faced in the visitor's logbook, except the ones kept. */
async function faceEverythingExcept(page: Page, kept: string[]) {
  const response = await page.request.get('/api/fr/phobias')
  const slugs: string[] = (await response.json()).map((phobia: { slug: string }) => phobia.slug)
  await page.goto('/')
  await page.evaluate(
    ([faced]) => {
      const entries = Object.fromEntries(
        faced.map((slug) => [
          slug,
          { reachedLevel: 5, lastExit: { level: 5, choice: 'stop' }, updatedAt: new Date().toISOString() },
        ]),
      )
      localStorage.setItem('phobos.logbook', JSON.stringify({ version: 1, entries }))
    },
    [slugs.filter((slug) => !kept.includes(slug))],
  )
}

test('the roulette serves one case file after another without repeating itself', async ({ page }) => {
  await page.goto('/fr/roulette')
  await expect(page.getByText('Tour 1 · Tirage 1')).toBeVisible()

  const names = [await caseFileName(page).textContent()]
  for (let draw = 2; draw <= 6; draw++) {
    await page.getByRole('button', { name: /passer ce dossier/i }).click()
    await expect(page.getByText(`Tour 1 · Tirage ${draw}`)).toBeVisible()
    await expect(caseFileName(page)).not.toHaveText(names.at(-1) as string)
    names.push(await caseFileName(page).textContent())
  }

  expect(new Set(names).size).toBe(6)
})

test('a verdict leads to the next draw and feeds the fear profile', async ({ page }) => {
  await page.goto('/fr/roulette')
  const first = await caseFileName(page).textContent()

  await page.getByRole('button', { name: /j’ai compris/i }).click()
  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()
  await expect(page.getByText('Très phobique', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(`${first} — arrêt au niveau 1`)).toBeVisible()

  await page.getByRole('button', { name: /tirer la suivante/i }).click()
  await expect(page.getByText('Tour 1 · Tirage 2')).toBeVisible()
  await expect(caseFileName(page)).not.toHaveText(first as string)
})

test('the "not faced yet" option only draws what is left, then says everything was faced', async ({
  page,
}) => {
  await faceEverythingExcept(page, ['pediophobia'])

  await page.goto('/fr/roulette?skipFaced=true')
  await expect(page.getByRole('checkbox', { name: /pas encore affrontées/i })).toBeChecked()
  await expect(caseFileName(page)).toHaveText('Pédiophobie')

  await faceEverythingExcept(page, [])
  await page.goto('/fr/roulette?skipFaced=true')
  await expect(page.getByText('Tout affronté')).toBeVisible()

  await page.getByRole('button', { name: /tirer parmi tous les dossiers/i }).click()
  await expect(page.getByRole('checkbox', { name: /pas encore affrontées/i })).not.toBeChecked()
  await expect(caseFileName(page)).toBeVisible()
})
