import { expect, test } from '@playwright/test'
import { LANGS } from '../src/i18n/languages'
import { MESSAGES } from '../src/i18n/messages'

for (const lang of LANGS) {
  test(`every page speaks ${lang}`, async ({ page }) => {
    const t = MESSAGES[lang]
    const arachnophobia = await (await page.request.get(`/api/${lang}/phobias/arachnophobia`)).json()
    const title = page.getByRole('heading', { level: 1 })

    await page.goto(`/${lang}`)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page).toHaveTitle(t.meta.title)
    await expect(title).toContainText(t.home.title.accent)

    await page.goto(`/${lang}/${t.paths.dossiers}`)
    await expect(title).toHaveText(t.catalogue.title)
    await page.getByRole('link', { name: `${t.caseFile.file('N°001')}, ${arachnophobia.name}` }).click()

    await expect(page).toHaveURL(new RegExp(`/${lang}/${t.paths.dossiers}/arachnophobia$`))
    await expect(title).toHaveText(arachnophobia.name)
    await page.getByRole('button', { name: t.warning.accept }).click()
    await expect(page.getByRole('heading', { name: t.levels[1].name })).toBeVisible()

    await page.goto(`/${lang}/${t.paths.roulette}`)
    await expect(page.getByRole('checkbox', { name: t.roulette.skipFaced })).toBeVisible()

    await page.goto(`/${lang}/${t.paths['mon-dossier']}`)
    await expect(title).toHaveText(t.myFile.title)
  })
}

test.describe('a visitor whose browser speaks German', () => {
  test.use({ locale: 'de-DE' })

  test('lands on the German archives', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/de$/)
  })

  test('gets an address in another language in German words', async ({ page }) => {
    await page.goto('/case-files')

    await expect(page).toHaveURL(/\/de\/akten$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(MESSAGES.de.catalogue.title)
  })
})

test('an old address with the French words still opens the case file', async ({ page }) => {
  await page.goto('/en/dossiers/arachnophobia')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arachnophobia')
})

test('an address without a language gets one, search included', async ({ page }) => {
  await page.goto('/dossiers?status=todo')

  await expect(page).toHaveURL(/\/fr\/dossiers\?status=todo$/)
})

test('switching language keeps the page, in the words of the new language, and is remembered for the next visit', async ({
  page,
}) => {
  await page.goto('/fr/dossiers?category=strange')

  await page.getByRole('combobox', { name: MESSAGES.fr.nav.language }).selectOption('it')

  await expect(page).toHaveURL(/\/it\/fascicoli\?category=strange$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(MESSAGES.it.catalogue.title)
  await page.goto('/')
  await expect(page).toHaveURL(/\/it$/)
})
