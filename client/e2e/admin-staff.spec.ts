import { test, expect } from '@playwright/test';

test.describe('Admin Staff Management', () => {
  test('should login as admin and create a new staff account', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/auth');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'change-me');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Navigate to Staff Management
    await page.click('aside a[href="/admin/staff"]');
    await expect(page).toHaveURL(/\/admin\/staff/);
    await expect(page.getByRole('heading', { name: 'Quản lý nhân viên', exact: true })).toBeVisible();

    // Generate unique credentials to avoid duplicate database errors
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const testUsername = `staff_e2e_${randomSuffix}`;
    const testEmail = `staff_${randomSuffix}@example.com`;
    const testPhone = `090900${randomSuffix}`;
    const testFullName = `Staff E2E Autotest ${randomSuffix}`;

    // 3. Trigger "Thêm nhân viên mới" dialog
    await page.click('button:has-text("Thêm nhân viên mới")');
    await expect(page.locator('[role="dialog"]').getByRole('heading', { name: 'Thêm nhân viên mới', exact: true })).toBeVisible();

    // 4. Fill form
    await page.fill('#add-username', testUsername);
    await page.fill('#add-password', 'staff_pass_123');
    await page.fill('#add-fullName', testFullName);
    await page.fill('#add-email', testEmail);
    await page.fill('#add-phone', testPhone);

    // 5. Submit form
    await page.waitForTimeout(500);
    await page.locator('[role="dialog"] button').filter({ hasText: /^Thêm nhân viên$/ }).click();

    // 6. Verify form is submitted and dialog is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // Reload the page to fetch fresh records from the database
    await page.reload();

    // 7. Verify new staff is displayed in the list
    await expect(page.getByText(testFullName)).toBeVisible();
    await expect(page.getByText(testUsername)).toBeVisible();
  });
});
