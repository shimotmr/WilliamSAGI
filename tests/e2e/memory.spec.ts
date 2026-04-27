import { expect, test } from '@playwright/test'
import { SignJWT } from 'jose'

const SESSION_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'playwright-poc-secret')

async function createAdminSessionToken() {
  return new SignJWT({ email: 'playwright@example.com', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SESSION_SECRET)
}

test.describe('Hub shared memory', () => {
  test('可讀取 live status 並完成查詢', async ({ page, context, baseURL }) => {
    const session = await createAdminSessionToken()
    const url = new URL(baseURL || 'http://127.0.0.1:3000')

    await context.addCookies([
      {
        name: 'session',
        value: session,
        domain: url.hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    await page.goto('/hub/memory')

    await expect(page.getByTestId('memory-page-title')).toHaveText('共享記憶總覽')
    await expect
      .poll(async () => await page.getByTestId('memory-status-backend').textContent(), {
        timeout: 15000,
      })
      .toContain('supabase-trgm')
    await expect(page.getByTestId('memory-sync-status')).toBeVisible()
    await expect(page.getByTestId('memory-topic-clusters')).toBeVisible()

    for (const testId of [
      'memory-count-memory_claims',
      'memory-count-reference_items',
      'memory-count-memory_relations',
      'memory-count-memory_events',
      'memory-count-agent_profiles',
    ]) {
      await expect(page.getByTestId(testId)).toContainText(/[0-9]/)
    }

    for (const sourceTestId of [
      'memory-source-card-codex',
      'memory-source-card-hermes',
      'memory-source-card-openclaw',
      'memory-source-card-cloud_code',
    ]) {
      await expect(page.getByTestId(sourceTestId)).toBeVisible()
    }

    await expect(page.getByTestId('memory-topic-cluster-shared-memory')).toBeVisible()

    await page.getByTestId('memory-search-input').fill('telegram')
    await page.getByTestId('memory-search-submit').click()

    await expect(page.getByTestId('memory-search-result').first()).toBeVisible()
  })

  test('手機版仍可閱讀重點卡片與查詢結果', async ({ page, context, baseURL }) => {
    await page.setViewportSize({ width: 393, height: 852 })

    const session = await createAdminSessionToken()
    const url = new URL(baseURL || 'http://127.0.0.1:3000')

    await context.addCookies([
      {
        name: 'session',
        value: session,
        domain: url.hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    await page.goto('/hub/memory')

    await expect(page.getByTestId('memory-page-title')).toHaveText('共享記憶總覽')
    await expect(page.getByTestId('memory-count-memory_claims')).toBeVisible()
    await expect(page.getByTestId('memory-sync-status')).toBeVisible()
    await expect(page.getByTestId('memory-topic-cluster-shared-memory')).toBeVisible()

    await expect(page.getByTestId('memory-search-input')).toHaveCSS('font-size', '16px')

    await page.getByTestId('memory-search-result').first().scrollIntoViewIfNeeded()
    await expect(page.getByTestId('memory-search-result').first()).toBeVisible()
  })
})
