import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'

const PORT = '4175'
const BASE_URL = `http://127.0.0.1:${PORT}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // keep waiting
    }

    await sleep(500)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function isServerReachable(url) {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

function startPreviewServer() {
  return spawn(`npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`, [], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  })
}

async function main() {
  const server = (await isServerReachable(BASE_URL)) ? null : startPreviewServer()

  server?.stdout.on('data', (chunk) => process.stdout.write(chunk))
  server?.stderr.on('data', (chunk) => process.stderr.write(chunk))

  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(`${BASE_URL}/missions/sql-load-warehouse`)
    await page.getByText(/Boot the Warehouse Feed/i).waitFor({ timeout: 15000 })
    await page.getByText(/^ready$/).waitFor({ timeout: 60000 })
    await page.getByRole('button', { name: /Run Python/i }).click()
    await page.getByRole('radio', { name: 'conn' }).check()
    await page.getByRole('radio', { name: 'pd.read_sql(...)' }).check()
    await page
      .getByRole('radio', {
        name: /Because analysts often pull data from SQL first, then manipulate it with pandas/i,
      })
      .check()
    await page
      .getByPlaceholder(
        'Example: We queried the operational tables into pandas so we could join and summarize them in Python.',
      )
      .fill('We query SQL tables into pandas DataFrames so we can merge and summarize them in Python.')
    await page.getByRole('button', { name: /Grade mission/i }).click()
    await page.getByText(/Total score/i).waitFor({ timeout: 60000 })
    await page.goto(`${BASE_URL}/progress`)
    await page.getByText(/Mission summary/i).waitFor({ timeout: 15000 })
    await browser.close()
  } finally {
    server?.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
