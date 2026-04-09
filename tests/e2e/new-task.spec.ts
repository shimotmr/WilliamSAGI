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

test.describe('Hub 新增任務 POC', () => {
  test('可完成三步驟任務建立流程', async ({ page, context, baseURL }) => {
    await page.route('**/api/new-task/submit', async route => {
      const payload = route.request().postDataJSON() as {
        description?: string
        priority?: string
        answers?: Record<string, string | string[]>
      }

      expect(payload.description).toContain('開發 Playwright 自動驗收流程')
      expect(payload.priority).toBe('P1')
      expect(payload.answers?.platform).toBe('Web')
      expect(payload.answers?.language).toEqual(['TypeScript', 'Python'])

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 4253, status: 'ok' }),
      })
    })

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

    await page.goto('/hub/new-task')

    await expect(page.getByTestId('new-task-title')).toHaveText('新建任務')

    await page.getByTestId('task-description-input').fill('開發 Playwright 自動驗收流程 POC，驗證前端任務派發介面')
    await page.getByTestId('task-description-next').click()

    await expect(page.getByTestId('detected-task-type')).toHaveText('開發')
    await expect(page.getByText('開發平台？')).toBeVisible()

    await page.getByLabel('Web').click()
    await page.getByLabel('TypeScript').click()
    await page.getByLabel('Python').click()
    await page.getByRole('button', { name: 'P1' }).click()
    await page.getByPlaceholder('輸入內容...').fill('今天下班前')

    await page.getByTestId('questions-next').click()

    await expect(page.getByText('任務摘要')).toBeVisible()
    await expect(page.getByTestId('selected-priority')).toHaveText('P1')
    await expect(page.getByText('開發 Playwright 自動驗收流程 POC，驗證前端任務派發介面')).toBeVisible()

    await page.getByTestId('submit-task').click()

    await expect(page.getByTestId('task-submit-success')).toBeVisible()
    await expect(page.getByText('任務 ID: #4253')).toBeVisible()
  })
})
