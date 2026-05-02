const { test, expect } = require('@playwright/test');
const target = process.env.TARGET_URL || 'http://localhost:8080';
test('quizzes page loads and has start controls', async ({ page }) => { await page.goto(target + '/pages/quizzes.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toContainText(/מבחן|תרגול|שאלות/); });
test('exam questions page loads', async ({ page }) => { await page.goto(target + '/pages/exam-questions.html', {waitUntil:'domcontentloaded'}); await expect(page.locator('body')).toContainText(/התחל|שאלות|מבחן/); });
