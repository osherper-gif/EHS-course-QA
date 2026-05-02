const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test('login page loads', async ({ page }) => { await page.goto(target + '/login.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toContainText(/Google|Email|מייל|כניסה/); });
test('protected page does not expose secrets to anonymous user', async ({ page }) => { await page.goto(target + '/admin.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).not.toContainText('privateKey'); });
