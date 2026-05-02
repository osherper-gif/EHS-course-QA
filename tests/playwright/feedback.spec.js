const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test('feedback UI page loads', async ({ page }) => { await page.goto(target, {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toBeVisible(); });
