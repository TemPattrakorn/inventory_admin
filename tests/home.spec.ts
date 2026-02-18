import { test, expect } from '@playwright/test';

test('/manage page shows จัดการวัสดุ title', async ({ page }) => {
  await page.goto('/manage', { waitUntil: 'networkidle' }); // uses baseURL from config

  // Vuetify renders: <div class="v-toolbar-title__placeholder">จัดการวัสดุ</div>
  const title = page.locator('.v-toolbar-title__placeholder');
  await expect(title).toHaveText(/จัดการวัสดุ/);
});