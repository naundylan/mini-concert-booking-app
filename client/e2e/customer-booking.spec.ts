import { test, expect } from '@playwright/test';

test.describe('Customer Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock session API for RoleGuard to identify user as CUSTOMER
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          data: {
            role: 'CUSTOMER',
            userInfo: {
              id: 'd9b23b12-9c1a-4f51-b841-8c4333917800',
              fullName: 'Customer E2E Test',
              username: 'customer_e2e',
              email: 'customer@example.com',
              phone: '0901234567',
              role: 'CUSTOMER'
            }
          },
          message: 'Lấy thông tin người dùng thành công'
        }
      });
    });

    // 2. Mock event list API
    await page.route('**/api/v1/customer/events?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          data: {
            content: [
              {
                id: 'e2e-event-rock-2026',
                name: 'Đại Nhạc Hội Rock Việt Nam 2026',
                startTime: '2026-12-25T19:00:00Z',
                endTime: '2026-12-25T23:00:00Z',
                openTime: '2026-06-01T09:00:00Z',
                location: 'Sân vận động Mỹ Đình, Hà Nội',
                bannerUrl: null,
                status: 'ONSALE',
                ticketClasses: [
                  { id: 'class-vip', name: 'VIP', price: 1500000, colorCode: '#ef4444' },
                  { id: 'class-standard', name: 'Standard', price: 500000, colorCode: '#3b82f6' }
                ],
                seatSummary: { total: 100, available: 85 }
              }
            ],
            pageable: { pageNumber: 0, pageSize: 9 },
            totalElements: 1,
            totalPages: 1,
            last: true
          },
          message: 'Lấy danh sách sự kiện thành công'
        }
      });
    });

    // 3. Mock event detail API
    await page.route('**/api/v1/customer/events/e2e-event-rock-2026', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          data: {
            id: 'e2e-event-rock-2026',
            name: 'Đại Nhạc Hội Rock Việt Nam 2026',
            description: 'Sự kiện âm nhạc hoành tráng nhất năm với các ban nhạc hàng đầu.',
            startTime: '2026-12-25T19:00:00Z',
            endTime: '2026-12-25T23:00:00Z',
            openTime: '2026-06-01T09:00:00Z',
            location: 'Sân vận động Mỹ Đình, Hà Nội',
            bannerUrl: null,
            status: 'ONSALE',
            ticketClasses: [
              { id: 'class-vip', name: 'VIP', price: 1500000, colorCode: '#ef4444' },
              { id: 'class-standard', name: 'Standard', price: 500000, colorCode: '#3b82f6' }
            ],
            seatSummary: { total: 100, available: 85 }
          },
          message: 'Lấy chi tiết sự kiện thành công'
        }
      });
    });
  });

  test('should view event list, navigate to event detail, and start booking process', async ({ page }) => {
    // Set a longer timeout for this test as Next.js builds pages on the fly in dev mode
    test.setTimeout(30000);

    // Register browser console and error logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Go to customer events page
    await page.goto('/customer/events');

    // Verify title and page header
    await expect(page.getByRole('heading', { name: 'Sự kiện', exact: true })).toBeVisible();
    await expect(page.locator('text=Xem sự kiện sắp mở bán và đặt vé')).toBeVisible();

    // Verify event card is visible
    await expect(page.locator('text=Đại Nhạc Hội Rock Việt Nam 2026')).toBeVisible();
    await expect(page.locator('text=Sân vận động Mỹ Đình, Hà Nội')).toBeVisible();

    // Click on "Xem chi tiết" button to go to detail page
    await page.click('a[href="/customer/events/e2e-event-rock-2026"]');

    // Verify redirection to details page (using increased timeout for on-demand compile)
    await expect(page).toHaveURL(/\/customer\/events\/e2e-event-rock-2026/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Đại Nhạc Hội Rock Việt Nam 2026', exact: true })).toBeVisible({ timeout: 15000 });

    // Verify Event Detail Info
    await expect(page.locator('text=Sự kiện âm nhạc hoành tráng nhất năm')).toBeVisible();
    await expect(page.locator('text=VIP')).toBeVisible();
    await expect(page.locator('text=1.500.000')).toBeVisible();

    // Click "Mua vé" button
    await page.click('button:has-text("Mua vé")');

    // Verify redirection to seats booking page
    await expect(page).toHaveURL(/\/customer\/booking\/e2e-event-rock-2026\/seats/);
  });
});
