import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

/** WCAG 2.2 A and AA rules checked by axe on the page as it stands. */
async function violations(page: Page) {
  // Fade-ins would be measured half transparent: wait until nothing moves.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  )
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.map(
    ({ id, impact, help, nodes }) =>
      `${impact} ${id}: ${help} (${nodes.map((node) => node.target.join(' ')).join(', ')})`,
  )
}

for (const [name, url, heading] of [
  ['home', '/fr', 'Trouve'],
  ['catalogue', '/fr/dossiers', 'Dossiers'],
  ['roulette', '/fr/roulette', 'Arachnophobie|Ophiophobie|Entomophobie|.+'],
  ['my file (empty)', '/fr/mon-dossier', 'Mon dossier'],
  ['unknown case file', '/fr/dossiers/unknown-fear', ''],
] as const) {
  test(`the ${name} page has no accessibility violation`, async ({ page }) => {
    await page.goto(url)
    if (heading) await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(heading, 'i'))
    else await expect(page.getByText('Dossier introuvable')).toBeVisible()

    expect(await violations(page)).toEqual([])
  })
}

test('every step of a case file journey has no accessibility violation', async ({ page }) => {
  await page.goto('/fr/dossiers/arachnophobia')
  await expect(page.getByRole('button', { name: /j’ai compris/i })).toBeVisible()
  expect(await violations(page), 'warning').toEqual([])

  await page.getByRole('button', { name: /j’ai compris/i }).click()
  for (const level of ['Apprivoiser', 'Approcher', 'Examiner', 'Confronter']) {
    await expect(page.getByRole('heading', { name: level })).toBeVisible()
    expect(await violations(page), level).toEqual([])
    await page.getByRole('button', { name: /niveau suivant/i }).click()
  }
  await expect(page.getByRole('heading', { name: 'Affronter' })).toBeVisible()
  expect(await violations(page), 'Affronter').toEqual([])

  await page.getByRole('button', { name: /pitié, on arrête ici/i }).click()
  await expect(page.getByText('Sensible', { exact: true })).toBeVisible()
  expect(await violations(page), 'verdict').toEqual([])

  await page.goto('/fr/mon-dossier')
  await expect(page.getByRole('heading', { name: 'Ton profil de peurs' })).toBeVisible()
  expect(await violations(page), 'my file with a profile').toEqual([])
})

/** Presses Tab until the focused element is the button or link with that text, as a keyboard user would. */
async function tabTo(page: Page, name: RegExp) {
  for (let presses = 0; presses < 60; presses++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.textContent ?? '')
    if (name.test(focused)) return
  }
  throw new Error(`No element matching ${name} could be reached with Tab`)
}

test('a case file journey can be played with the keyboard alone', async ({ page }) => {
  await page.goto('/fr/dossiers/arachnophobia')

  await tabTo(page, /j’ai compris/i)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Apprivoiser' })).toBeVisible()
  await tabTo(page, /niveau suivant/i)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Approcher' })).toBeVisible()
  await tabTo(page, /pitié, on arrête ici/i)
  await page.keyboard.press('Enter')

  await expect(page.getByText('Phobique', { exact: true })).toBeVisible()
})
