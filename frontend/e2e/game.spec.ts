import { test, expect } from '@playwright/test'

test('solo match completes five rounds, restores a seat, and supports rematches', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByLabel('What should we call you?').fill('Solo Tester')
  await page.getByRole('button', { name: 'Find your rhythm' }).click()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled()
  await expect(
    page.getByText('Solo Tester', { exact: false }).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Turn sound on' }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  for (let round = 1; round <= 5; round++) {
    await expect(
      page.getByText(`Round ${round} of 5`, { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Feel it. Don’t overthink it.' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'STOP THE CLOCK' }).click()
    const next = page.getByRole('button', {
      name: round === 5 ? 'One more match' : 'Next round',
    })
    await expect(next).toBeVisible()
    if (round !== 5) await next.click()
  }
  await expect(
    page.getByRole('heading', { name: 'Your time, revealed.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'One more match' }).click()
  await expect(page.getByText('Round 1 of 5', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'Leave practice' }).click()
  await expect(page.getByLabel('What should we call you?')).toBeVisible()
})

test('two players share a room, keep guesses private, reconnect, and transfer host control', async ({
  browser,
}) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()
  try {
    await host.goto('/')
    await host
      .getByRole('button', { name: 'With friends', exact: true })
      .click()
    await host.getByLabel('What should we call you?').fill('Host Tester')
    await host.getByRole('button', { name: 'Create a room' }).click()
    await expect(
      host.getByRole('button', { name: 'Waiting for a friend' }),
    ).toBeDisabled()
    const code = await host.locator('.share-box > span').innerText()
    await guest.goto(`/?room=${code}`)
    await guest.getByLabel('What should we call you?').fill('Guest Tester')
    await guest.getByRole('button', { name: 'Join the room' }).click()
    await expect(
      host.getByRole('button', { name: 'Start the match' }),
    ).toBeEnabled()
    await guest.reload()
    await expect(
      guest.getByRole('heading', { name: 'Gather your people.' }),
    ).toBeVisible()
    await host.getByRole('button', { name: 'Start the match' }).click()
    await expect(
      host.getByRole('button', { name: 'STOP THE CLOCK' }),
    ).toBeEnabled()
    await host.getByRole('button', { name: 'STOP THE CLOCK' }).click()
    await expect(host.getByRole('button', { name: 'Locked in' })).toBeDisabled()
    await expect(
      host.getByText('Waiting for the others. All guesses reveal together.'),
    ).toBeVisible()
    await expect(host.locator('.result-list')).toHaveCount(0)
    await guest.getByRole('button', { name: 'STOP THE CLOCK' }).click()
    await expect(host.locator('.result-row')).toHaveCount(2)
    await expect(guest.locator('.result-row')).toHaveCount(2)
    await hostContext.close()
    await expect(
      guest.getByRole('button', { name: 'Next round' }),
    ).toBeEnabled()
    await guest.getByRole('button', { name: 'Next round' }).click()
    await expect(guest.getByText('Round 2 of 5', { exact: true })).toBeVisible()
  } finally {
    await hostContext.close()
    await guestContext.close()
  }
})

test('invalid room shows a recoverable error', async ({ page }) => {
  await page.goto('/?room=ZZZZZZ')
  await page.getByLabel('What should we call you?').fill('Lost Tester')
  await page.getByRole('button', { name: 'Join the room' }).click()
  await expect(page.getByRole('alert')).toContainText('Room not found')
  await expect(
    page.getByRole('button', { name: 'Join the room' }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Solo', exact: true }).click()
  await page.getByRole('button', { name: 'Find your rhythm' }).click()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled()
})

test('mobile layout fits and the instructions dialog supports keyboard dismissal', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('drift-mobile.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'How to play' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByLabel('What should we call you?').fill('Mobile Tester')
  await page.getByRole('button', { name: 'Find your rhythm' }).click()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('desktop layout fits and the game is ready to enter', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Find your rhythm' }),
  ).toBeEnabled()
  await page.evaluate(() => document.fonts.ready)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('drift-desktop.png'),
    fullPage: true,
  })
})

test('Cowboy serves the built app and rejects an untrusted browser origin', async ({
  page,
  request,
}) => {
  const rejected = await request.get('http://127.0.0.1:4000/ws', {
    headers: { origin: 'https://untrusted.example' },
  })
  expect(rejected.status()).toBe(403)
  await page.goto('http://127.0.0.1:4000')
  await page.getByLabel('What should we call you?').fill('Built App Tester')
  await page.getByRole('button', { name: 'Find your rhythm' }).click()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled()
})
