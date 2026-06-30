import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show error toast with invalid credentials', async ({ page }) => {
    // Go to login page
    await page.goto('/auth');

    // Verify page load
    await expect(page).toHaveTitle(/Mini Concert Booking/);
    await expect(page.locator('h1')).toHaveText('Mini Concert Booking');

    // Fill invalid credentials
    await page.fill('#username', 'invalid_user');
    await page.fill('#password', 'wrong_password');

    // Submit
    await page.click('button[type="submit"]');

    // Verify toast error
    const toastDescription = page.locator('ol[tabindex="-1"] li div[class*="description"]');
    // Alternatively wait for any error text in the viewport
    await expect(page.getByText('Tên đăng nhập hoặc mật khẩu không đúng').first()).toBeVisible();
  });

  test('should login successfully as Admin and logout', async ({ page }) => {
    // Go to login page
    await page.goto('/auth');

    // Fill valid admin credentials (default seeds)
    await page.fill('#username', 'admin');
    await page.fill('#password', 'change-me');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirection to Admin Dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Verify sidebar elements
    await expect(page.locator('aside').getByText('Bảng điều khiển', { exact: true })).toBeVisible();
    await expect(page.locator('text=Nhân viên')).toBeVisible();

    // Click profile dropdown trigger in sidebar (has avatar icon)
    await page.click('button:has(.h-10)');

    // Click "Đăng xuất" item
    await page.click('span:has-text("Đăng xuất")');

    // Verify redirect back to auth login page
    await expect(page).toHaveURL(/\/auth/);
  });
});
