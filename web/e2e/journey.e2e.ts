import { expect, test } from '@playwright/test'

test('a visitor faces a phobia to the end and finds it marked in the archives', async ({ page }) => {
  await page.goto('/fr/dossiers/arachnophobia')

  await expect(page.getByRole('heading', { name: 'Arachnophobie' })).toBeVisible()
  await page.getByRole('button', { name: /j’ai compris/i }).click()

  await expect(page.getByRole('heading', { name: 'Apprivoiser' })).toBeVisible()
  await page.getByRole('button', { name: /niveau suivant/i }).click()

  await expect(page.getByRole('heading', { name: 'Approcher' })).toBeVisible()
  await page.getByRole('button', { name: /niveau suivant/i }).click()

  await expect(page.getByRole('heading', { name: 'Examiner' })).toBeVisible()
  await page.getByRole('button', { name: /niveau suivant/i }).click()
  await expect(page.getByRole('heading', { name: 'Confronter' })).toBeVisible()
  await page.getByRole('button', { name: /niveau suivant/i }).click()
  await expect(page.getByRole('heading', { name: 'Affronter' })).toBeVisible()
  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()
  await expect(page.getByText('Sensible', { exact: true })).toBeVisible()

  await page.goto('/fr/dossiers')
  await page.reload()
  await expect(page.getByRole('link', { name: 'Dossier N°001, Arachnophobie — affronté' })).toBeVisible()
  await expect(page.getByText('/ 30', { exact: true })).toBeVisible()
  const myFile = page.getByRole('link', { name: /mon dossier|moi/i })
  await expect(myFile).toContainText('1')

  await myFile.click()
  await expect(page.getByRole('heading', { name: 'Mon dossier' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Arachnophobie' })).toContainText('Affronté')
  await expect(page.getByText('Arachnophobie — arrêt au niveau 5')).toBeVisible()
})

test('stopping at level 1 gives the "Très phobique" verdict without marking the phobia as faced', async ({
  page,
}) => {
  await page.goto('/fr/dossiers/coulrophobia')
  await page.getByRole('button', { name: /j’ai compris/i }).click()

  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()

  await expect(page.getByText('Très phobique', { exact: true })).toBeVisible()
  await page.goto('/fr/dossiers?status=faced')
  await expect(page.getByText(/aucun dossier ne correspond/i)).toBeVisible()
})

test('an unknown case file says so', async ({ page }) => {
  await page.goto('/fr/dossiers/unknown-fear')

  await expect(page.getByText('Dossier introuvable')).toBeVisible()
})

test('the verdict card is downloaded as a PNG when the browser cannot share files', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined })
  })
  await page.goto('/fr/dossiers/arachnophobia')
  await page.getByRole('button', { name: /j’ai compris/i }).click()
  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Partager mon verdict' }).click()

  expect((await download).suggestedFilename()).toBe('phobos-arachnophobia-veryPhobic.png')
  await expect(page.getByText(/carte téléchargée/i)).toBeVisible()
})
