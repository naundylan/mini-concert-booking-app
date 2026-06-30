import { test, expect } from '@playwright/test';

test.describe('Staff POS Flow', () => {
  test('should create a staff account, login as staff, and access POS', async ({ page }) => {
    // 1. Login as Admin to create a Staff account
    await page.goto('/auth');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'change-me');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Navigate to Staff Page
    await page.click('aside a[href="/admin/staff"]');
    await expect(page).toHaveURL(/\/admin\/staff/);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const posStaffUser = `pos_staff_${randomSuffix}`;
    const posStaffPass = `pos_pass_${randomSuffix}`;
    const posStaffName = `POS E2E Staff ${randomSuffix}`;

    // 3. Create Staff account
    await page.click('button:has-text("Thêm nhân viên mới")');
    await page.fill('#add-username', posStaffUser);
    await page.fill('#add-password', posStaffPass);
    await page.fill('#add-fullName', posStaffName);
    await page.fill('#add-email', `${posStaffUser}@example.com`);
    await page.fill('#add-phone', `091234${randomSuffix}`);
    await page.waitForTimeout(500);
    await page.locator('[role="dialog"] button').filter({ hasText: /^Thêm nhân viên$/ }).click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // 4. Logout Admin
    await page.click('button:has(.h-10)');
    await page.click('span:has-text("Đăng xuất")');
    await expect(page).toHaveURL(/\/auth/);

    // 5. Login as newly created Staff
    await page.fill('#username', posStaffUser);
    await page.fill('#password', posStaffPass);
    await page.click('button[type="submit"]');

    // 6. Verify redirect to POS page
    await expect(page).toHaveURL(/\/staff\/pos/);
    await expect(page.getByRole('heading', { name: 'POS bán vé tại quầy' })).toBeVisible();

    // 7. Verify POS layout (checkout panel and event info)
    await expect(page.getByText('Chọn sự kiện để bán vé')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chọn sự kiện' })).toBeVisible();

    // 8. Logout Staff
    await page.click('button:has(.h-10)');
    await page.click('span:has-text("Đăng xuất")');
    await expect(page).toHaveURL(/\/auth/);
  });
});
