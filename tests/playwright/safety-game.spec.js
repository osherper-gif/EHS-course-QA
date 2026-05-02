const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test('safety game landing loads', async ({ page }) => { await page.goto(target + '/pages/safety-game.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toContainText(/אתגר|בטיחות|רמה/); });
test('game challenge page loads', async ({ page }) => { await page.goto(target + '/pages/game-challenge.html?stage=stage-01', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).not.toHaveText(/^\s*$/); });
