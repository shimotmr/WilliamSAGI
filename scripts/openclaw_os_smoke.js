const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const { SignJWT } = require('jose')

const token = process.env.OPENCLAW_OS_SMOKE_TOKEN
const targetPath = process.env.OPENCLAW_OS_SMOKE_PATH || '/openclaw-os'
const baseUrl = process.env.OPENCLAW_OS_SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const smokeEmail = process.env.OPENCLAW_OS_SMOKE_EMAIL || 'smoke-admin@local'

async function resolveToken() {
  if (token) return token

  const secret = process.env.JWT_SECRET
  if (!secret) return null

  return new SignJWT({ email: smokeEmail, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(new TextEncoder().encode(secret))
}

async function main() {
  const outDir = '/Users/travis/WilliamSAGI/output/playwright'
  fs.mkdirSync(outDir, { recursive: true })
  const sessionToken = await resolveToken()
  const url = new URL(baseUrl)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    baseURL: url.origin,
  })

  if (sessionToken) {
    await context.addCookies([
      {
        name: 'session',
        value: sessionToken,
        domain: url.hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
  }

  const page = await context.newPage()
  const consoleIssues = []
  const smokeTarget = sessionToken
    ? targetPath
    : `${targetPath}${targetPath.includes('?') ? '&' : '?'}dev-smoke=1`

  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleIssues.push({ type: msg.type(), text: msg.text() })
    }
  })

  page.on('pageerror', (error) => {
    consoleIssues.push({ type: 'pageerror', text: String(error) })
  })

  await page.goto(smokeTarget, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  const loadingStillVisible = await page
    .locator('text=正在啟動 OpenClaw OS…')
    .first()
    .isVisible()
    .catch(() => false)

  const checks = {
    url: page.url(),
    title: await page.title(),
    loadingDismissed: !loadingStillVisible,
    workspaceShell: await page.locator('text=Workspace Shell').first().isVisible().catch(() => false),
    systemPulse: await page.locator('text=System Pulse').first().isVisible().catch(() => false),
  }

  await page.screenshot({ path: path.join(outDir, 'openclaw-os-main.png'), fullPage: true })

  const eventsWorkspace = page.getByRole('button', { name: /Events/i }).first()
  if (await eventsWorkspace.isVisible().catch(() => false)) {
    await eventsWorkspace.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  checks.eventTrace = await page.locator('text=Event Trace').first().isVisible().catch(() => false)
  await page.screenshot({ path: path.join(outDir, 'openclaw-os-events.png'), fullPage: true })

  const telegramWorkspace = page.getByRole('button', { name: /Telegram/i }).first()
  if (await telegramWorkspace.isVisible().catch(() => false)) {
    await telegramWorkspace.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  checks.telegramConsole = await page.locator('text=Telegram Console').first().isVisible().catch(() => false)
  await page.screenshot({ path: path.join(outDir, 'openclaw-os-telegram-surface.png'), fullPage: true })

  const reportsWorkspace = page.getByRole('button', { name: /Reports/i }).first()
  if (await reportsWorkspace.isVisible().catch(() => false)) {
    await reportsWorkspace.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  checks.reportVault = await page.locator('text=Report Vault').first().isVisible().catch(() => false)
  await page.screenshot({ path: path.join(outDir, 'openclaw-os-reports-surface.png'), fullPage: true })

  await page.keyboard.press('Control+k').catch(() => {})
  await page.waitForTimeout(500)
  const paletteInput = page.locator('input[placeholder*="task id"]')
  checks.paletteOpen = await paletteInput
    .isVisible()
    .catch(() => false)
  await page.screenshot({ path: path.join(outDir, 'openclaw-os-palette.png'), fullPage: true })
  let telegramButtonCount = 0
  if (checks.paletteOpen) {
    await paletteInput.fill('telegram')
    await page.waitForTimeout(300)
    const telegramCommand = page.locator('button').filter({ hasText: 'Open Telegram Window' }).first()
    telegramButtonCount = await page.locator('button').filter({ hasText: 'Open Telegram Window' }).count()
    if (telegramButtonCount > 0) {
      await telegramCommand.click({ timeout: 5000 }).catch(() => {})
    } else {
      await page.keyboard.press('Escape').catch(() => {})
    }
  }
  await page.waitForTimeout(800)
  checks.telegramWindow = await page.locator('text=即時訊息視窗').first().isVisible().catch(() => false)
  await page.screenshot({ path: path.join(outDir, 'openclaw-os-telegram-window.png'), fullPage: true })

  const summary = { checks, telegramButtonCount, consoleIssues }
  fs.writeFileSync(path.join(outDir, 'openclaw-os-smoke.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
