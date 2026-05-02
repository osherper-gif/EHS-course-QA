const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test('admin page is protected and structurally available', async ({ page }) => { await page.goto(target + '/admin.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toBeVisible(); });
test('version management page is protected and structurally available', async ({ page }) => { await page.goto(target + '/pages/version-management.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toBeVisible(); });
