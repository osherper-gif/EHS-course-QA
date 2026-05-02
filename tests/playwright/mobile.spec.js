const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test.use({ viewport: { width: 390, height: 844 } });
test('mobile home has content', async ({ page }) => { await page.goto(target, {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toBeVisible(); await expect(page.locator('body')).not.toHaveText(/^\s*$/); });
test('mobile lesson opens without blank screen', async ({ page }) => { await page.goto(target + '/pages/lesson-01.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).not.toHaveText(/^\s*$/); });
