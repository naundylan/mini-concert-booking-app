import { test, expect } from '@playwright/test';

test.describe('Routing & Error Pages', () => {
  test('should render custom 404 page for non-existent route and navigate back', async ({ page }) => {
    // Go to unexisting page
    await page.goto('/some-unexisting-page-99999');

    // Verify custom 404 page content
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('text=Hàng ghế không tồn tại!')).toBeVisible();
    await expect(page.locator('text=Đường dẫn hoặc trang sự kiện bạn đang tìm kiếm không tồn tại')).toBeVisible();

    // Click redirect button
    await page.click('a:has-text("Quay về trang Đăng nhập")');

    // Verify redirected to login
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should render custom 403 unauthorized page', async ({ page }) => {
    // Go directly to /unauthorized route
    await page.goto('/unauthorized');

    // Verify custom 403 content
    await expect(page.locator('h1')).toHaveText('Từ Chối Truy Cập');
    await expect(page.locator('text=Khu vực hạn chế ra vào!')).toBeVisible();
    await expect(page.locator('text=Tài khoản của bạn không có đặc quyền truy cập')).toBeVisible();

    // Verify secondary logout action is visible
    await expect(page.locator('button:has-text("Đăng nhập tài khoản khác")')).toBeVisible();
  });
});
