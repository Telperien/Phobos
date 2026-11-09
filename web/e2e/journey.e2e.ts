import { expect, test } from '@playwright/test'

test('a visitor faces a phobia to the end and finds it marked in the archives', async ({ page }) => {
  await page.goto('/dossiers/arachnophobia')

  await expect(page.getByRole('heading', { name: 'Arachnophobie' })).toBeVisible()
  await page.getByRole('button', { name: /j’ai compris/i }).click()

  await expect(page.getByRole('heading', { name: 'Apprivoiser' })).toBeVisible()
  await page.getByRole('button', { name: /niveau suivant/i }).click()

  await expect(page.getByRole('heading', { name: 'Approcher' })).toBeVisible()
  const hold = page.getByRole('button', { name: /maintenir pour révéler/i })
  await hold.hover()
  await page.mouse.down()
  await expect(page.getByTestId('hold-to-reveal-media')).toHaveAttribute('data-revealed', 'true', {
    timeout: 3000,
  })
  await page.mouse.up()
  await page.getByRole('button', { name: /niveau suivant/i }).click()

  await expect(page.getByRole('heading', { name: 'Affronter' })).toBeVisible()
  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()
  await expect(page.getByText('Sensible', { exact: true })).toBeVisible()

  await page.goto('/dossiers')
  await page.reload()
  await expect(page.getByRole('link', { name: 'Dossier N°001, Arachnophobie — affronté' })).toBeVisible()
  await expect(page.getByText('/ 30', { exact: true })).toBeVisible()
  const myFile = page.getByRole('link', { name: /mon dossier|moi/i })
  await expect(myFile).toContainText('1')

  await myFile.click()
  await expect(page.getByRole('heading', { name: 'Mon dossier' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Arachnophobie' })).toContainText('Affronté')
  await expect(page.getByText('Arachnophobie — arrêt au niveau 3')).toBeVisible()
})

test('stopping at level 1 gives the "Très phobique" verdict without marking the phobia as faced', async ({
  page,
}) => {
  await page.goto('/dossiers/coulrophobia')
  await page.getByRole('button', { name: /j’ai compris/i }).click()

  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()

  await expect(page.getByText('Très phobique', { exact: true })).toBeVisible()
  await page.goto('/dossiers?status=faced')
  await expect(page.getByText(/aucun dossier ne correspond/i)).toBeVisible()
})

test('an unknown case file says so', async ({ page }) => {
  await page.goto('/dossiers/unknown-fear')

  await expect(page.getByText('Dossier introuvable')).toBeVisible()
})
