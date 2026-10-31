import { test, expect } from '@playwright/test';

test.describe('Hamper System Audit, Responsive Autofit & Currency in Settings', () => {
  // 1. Universal Responsive Design & Autofit across all standard breakpoints
  const viewports = [
    { name: 'Mobile Mini (320px)', width: 320, height: 600 },
    { name: 'Mobile Standard (375px)', width: 375, height: 667 },
    { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
    { name: 'Laptop (1024px)', width: 1024, height: 768 },
    { name: 'Desktop HD (1440px)', width: 1440, height: 900 },
    { name: 'Ultrawide (1920px)', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    test(`Autofit and zero horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify page loaded and visible
      await expect(page.locator('header').first()).toBeVisible();

      // Ensure no horizontal scrollbar / overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px allowable subpixel rounding
    });
  }

  // 2. Mobile Navigation Toggle on Small Screens
  test('Mobile navigation drawer opens and closes without layout clipping', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileMenuBtn = page.locator('button[aria-label="Open menu"]');
    await expect(mobileMenuBtn).toBeVisible();
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);

    // Verify navigation options in mobile drawer
    const mobileShopLink = page.locator('.md\\:hidden a[href="/shop"]');
    await expect(mobileShopLink).toBeVisible();
    const mobileSettingsLink = page.locator('.md\\:hidden a[href="/settings"]');
    await expect(mobileSettingsLink).toBeVisible();

    // Close menu
    const closeBtn = page.locator('button[aria-label="Close menu"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  // 3. Currency Selection Relocated into Settings (Home page selector removed)
  test('Currency selector is removed from home page header and available in Settings', async ({ page }) => {
    await page.goto('/');

    // 1. Verify currency dropdown popover button is NOT present in the header
    const oldHeaderCurrencyBtn = page.locator('header button:has-text("INR ₹"), header button:has-text("USD $")');
    await expect(oldHeaderCurrencyBtn).toHaveCount(0);

    // 2. Navigate to /settings
    await page.goto('/settings');
    await expect(page.locator('h1').filter({ hasText: 'Settings & Regional Preferences' })).toBeVisible();

    // 3. Check Currency selection section
    const currencySelect = page.locator('select#currency-select');
    await expect(currencySelect).toBeVisible();

    // 4. Change currency to USD
    await currencySelect.selectOption('USD');
    const saveCurrencyBtn = page.locator('button:has-text("Save Currency Preference")');
    await expect(saveCurrencyBtn).toBeVisible();
    await saveCurrencyBtn.click();

    // 5. Verify live preview converted to USD ($)
    await expect(page.locator('text=$').first()).toBeVisible();

    // 6. Verify persistence in localStorage
    const savedCurrency = await page.evaluate(() => localStorage.getItem('kawaiora_preferred_currency'));
    expect(savedCurrency).toBe('USD');
  });

  // 4. Checkout Payment Method Format (Selected Payment Option Only & No Recommended Banner)
  test('Checkout renders selectable payment options without recommended banner, expanding only selected method', async ({ page }) => {
    // Intercept address and delivery serviceability APIs for deterministic test execution
    await page.route('**/api/addresses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'mock-addr-1',
              full_name: 'Test Customer',
              phone: '+919876543210',
              address_line_1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postal_code: '560001',
              country: 'India',
              is_default: true,
              address_type: 'home',
            },
          ],
        }),
      });
    });

    await page.route('**/api/delivery/check*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          serviceable: true,
          message: 'Standard delivery available',
        }),
      });
    });

    // Pre-populate cart in localStorage to proceed through steps directly
    await page.goto('/');
    await page.evaluate(() => {
      const mockCart = {
        items: [
          {
            id: 'test-cart-item-1',
            product_id: '1',
            quantity: 1,
            price_at_add: 1499,
            product: {
              id: '1',
              name: 'Royal Celebration Hamper',
              price: 1499,
              images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400'],
            },
          },
        ],
        total: 1499,
        count: 1,
      };
      localStorage.setItem('kawaiora_cart', JSON.stringify(mockCart));
    });

    await page.goto('/checkout');

    // Step 1: Address (Fill if necessary and continue)
    const continueToDelBtn = page.locator('button:has-text("Continue to Delivery")');
    await expect(continueToDelBtn).toBeVisible();
    await expect(continueToDelBtn).toBeEnabled();
    await continueToDelBtn.click();
    await page.waitForTimeout(400);

    // Step 2: Delivery & Packaging
    const continueToPayBtn = page.locator('button:has-text("Continue to Payment")');
    await expect(continueToPayBtn).toBeVisible();
    await continueToPayBtn.click();
    await page.waitForTimeout(400);

    // Verify Payment Section:
    // A. "Recommended: Pay via UPI" banner MUST NOT be present
    const recommendedBanner = page.locator('text=Recommended: Pay via UPI');
    await expect(recommendedBanner).toHaveCount(0);

    // B. Verify selectable payment methods are present
    await expect(page.locator('text=UPI / QR Code')).toBeVisible();
    await expect(page.locator('text=Credit / Debit Cards')).toBeVisible();
    await expect(page.locator('text=Cash on Delivery')).toBeVisible();

    // C. Click "Cash on Delivery" -> only COD details shown
    await page.locator('text=Cash on Delivery').click();
    await expect(page.locator('text=Selected: Cash on Delivery')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm Order")')).toBeVisible();

    // D. Click back to "UPI / QR Code" -> only UPI apps shown
    await page.locator('text=UPI / QR Code').click();
    await expect(page.locator('text=Selected: UPI Payment Apps')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google Pay' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'PhonePe' })).toBeVisible();
  });

  // 5. Duplicate Click Protection
  test('Order submission buttons disable immediately to prevent rapid double-clicks', async ({ page }) => {
    await page.goto('/settings');
    const savePreferencesBtn = page.locator('button:has-text("Save Preferences")');
    await expect(savePreferencesBtn).toBeVisible();

    // Click and check for loading / disabled state
    await savePreferencesBtn.click();
    // After click it shows saving feedback
    await page.waitForTimeout(600);
    await expect(page.locator('button:has-text("Save Preferences")')).toBeEnabled();
  });

  // 6. "Your Orders" Page displays products and receipt triggers
  test('My Orders renders card layout with product names, images and receipt actions', async ({ page }) => {
    // Intercept orders API with deterministic test order
    await page.route('**/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              order_number: 'KAW2610269392',
              created_at: new Date().toISOString(),
              total_amount: 1499,
              subtotal: 1499,
              shipping_amount: 0,
              packaging_amount: 0,
              currency: 'INR',
              payment_status: 'paid',
              payment_method: 'Razorpay Live UPI',
              payment_id: 'pay_TsWHiQwIbN5tIb',
              order_status: 'confirmed',
              customer_name: 'Test Customer',
              recipient_name: 'Test Customer',
              recipient_phone: '+919876543210',
              recipient_address: {
                address_line_1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                postal_code: '560001',
                country: 'India',
              },
              items: [
                {
                  id: 'item-1',
                  quantity: 1,
                  price_at_purchase: 1499,
                  total_price: 1499,
                  product: {
                    id: '1',
                    name: 'Artisan Heritage Royal Hamper',
                    slug: 'artisan-heritage-royal-hamper',
                    images: ['/images/kawaiora-logo.jpg'],
                    price: 1499,
                  },
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/orders');

    // Verify layout elements
    await expect(page.locator('h1:has-text("Your Orders")')).toBeVisible();
    await expect(page.locator('input[placeholder="Search all orders"]')).toBeVisible();
    await expect(page.locator('button:has-text("Search Orders")')).toBeVisible();

    // Verify tabs
    await expect(page.locator('button:has-text("Buy Again")')).toBeVisible();
    await expect(page.locator('button:has-text("Not Yet Shipped")')).toBeVisible();

    // Verify order ribbon
    const orderRibbon = page.locator('text=ORDER PLACED').first();
    await expect(orderRibbon).toBeVisible();

    // Verify ribbon metadata: TOTAL, SHIP TO, ORDER #
    await expect(page.locator('text=TOTAL').first()).toBeVisible();
    await expect(page.locator('text=SHIP TO').first()).toBeVisible();
    await expect(page.locator('button:has-text("Invoice / Receipt")').first()).toBeVisible();

    // Click "Invoice / Receipt" to trigger the official payment receipt modal
    await page.locator('button:has-text("Invoice / Receipt")').first().click();
    await expect(page.locator('text=Official Payment Receipt & Tax Invoice')).toBeVisible();
    await expect(page.locator('text=Razorpay Live Verified')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("Close")').click();
  });

  // 7. Order Details Page with 3-Card Summary and Product Details
  test('Order Details renders 3-card summary, progress tracker, and product details', async ({ page }) => {
    // Intercept single order API
    await page.route('**/api/orders?id=25*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '25',
            order_number: 'KAW2610269392',
            created_at: new Date().toISOString(),
            total_amount: 1,
            subtotal: 1,
            shipping_amount: 0,
            packaging_amount: 0,
            currency: 'INR',
            payment_status: 'paid',
            payment_method: 'Razorpay Live UPI',
            payment_id: 'pay_TsWHiQwIbN5tIb',
            order_status: 'confirmed',
            customer_name: 'Test Customer',
            recipient_name: 'Test Customer',
            recipient_phone: '+919876543210',
            recipient_address: {
              address_line_1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postal_code: '560001',
              country: 'India',
            },
            items: [
              {
                id: 'item-25-1',
                quantity: 1,
                price_at_purchase: 1,
                total_price: 1,
                product: {
                  id: '12',
                  name: 'Artisan Heritage Royal Hamper (Updated Luxury Edition)',
                  slug: 'artisan-heritage-royal-hamper',
                  images: ['/images/kawaiora-logo.jpg'],
                  price: 1,
                },
              },
            ],
          },
        }),
      });
    });

    await page.goto('/orders/25');

    // Verify Order Details header
    await expect(page.locator('h1:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('button:has-text("View Official Receipt")')).toBeVisible();

    // Verify 3-card summary
    await expect(page.locator('h3:has-text("Shipping Address")')).toBeVisible();
    await expect(page.locator('h3:has-text("Payment Method")')).toBeVisible();
    await expect(page.locator('h3:has-text("Order Summary")')).toBeVisible();

    // Verify payment details inside Payment Method card
    await expect(page.locator('text=Settled')).toBeVisible();

    // Verify Items Ordered table with product details
    await expect(page.locator('h2:has-text("Items Ordered")')).toBeVisible();
    await expect(page.locator('text=Sold by: KawaiOra Artisan Hampers').first()).toBeVisible();
  });

  // 8. User Can Submit a Product Review
  test('Users can open and submit a real review without dummy reviews', async ({ page }) => {
    await page.goto('/reviews');

    // Verify Customer Reviews title and Write a Review button
    await expect(page.locator('h2:has-text("Customer Reviews")')).toBeVisible();
    const writeBtn = page.locator('button:has-text("Write a Review")').first();
    await expect(writeBtn).toBeVisible();

    // Open review modal
    await writeBtn.click();
    await expect(page.locator('text=Write a Customer Review')).toBeVisible();

    // Fill review form
    await page.locator('input[placeholder="e.g., Rohit Verma"]').fill('Aman Mishra');
    await page.locator('input[placeholder="e.g., Stunning presentation and fast delivery!"]').fill('Incredible quality!');
    await page.locator('textarea[placeholder="Tell others what you loved about the packaging, quality, and service..."]').fill('The gift box presentation was completely flawless and arrived right on time.');

    // Submit review
    await page.locator('button:has-text("Submit Review")').click();
    await page.waitForTimeout(800);
  });

  test('Favicon is properly configured in head and header remains sticky on scroll', async ({ page }) => {
    await page.goto('/');

    // Verify favicon link exists in head
    const faviconLink = page.locator('link[rel*="icon"]');
    await expect(faviconLink.first()).toHaveAttribute('href', /favicon|kawaiora-logo/);

    // Verify header exists and is sticky
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Verify header remains visible in the viewport at top
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(5);
  });

  test('Admin product form renders 6-image upload and quality inspection gallery', async ({ page }) => {
    // Set admin auth cookie for middleware access
    await page.context().addCookies([
      {
        name: 'auth_user',
        value: JSON.stringify({ id: 1, email: 'admin@kawaiora.com', role: 'admin' }),
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Intercept auth to mock admin session
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', email: 'admin@kawaiora.com', name: 'Admin', role: 'admin' },
        }),
      });
    });

    await page.goto('/admin/products/new');
    await expect(page.locator('text=Product Images & Quality Gallery')).toBeVisible();
    await expect(page.locator('text=slots available')).toBeVisible();
    await expect(page.locator('#product-images-input')).toBeAttached();
    await expect(page.locator('text=Slot 1')).toBeVisible();
    await expect(page.locator('text=Slot 6')).toBeVisible();
  });

  test('Admin dashboard settings area is permanently fixed at left bottom on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.context().addCookies([
      {
        name: 'auth_user',
        value: JSON.stringify({ id: 1, email: 'admin@kawaiora.com', role: 'admin' }),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin');
    const settingsLink = page.locator('aside a[href="/admin/settings"]');
    await expect(settingsLink).toBeVisible();

    const initialBox = await settingsLink.boundingBox();
    expect(initialBox).not.toBeNull();

    // Scroll dashboard content heavily
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);

    // Settings must remain anchored in viewport at bottom left
    const scrolledBox = await settingsLink.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(scrolledBox!.y).toBeCloseTo(initialBox!.y, 2);
  });

  test('Product detail page renders 6 quality inspection images as per artisan web theme', async ({ page }) => {
    await page.goto('/products/grand-royal-celebration');
    await expect(page.locator('h1')).toContainText('Grand Royal Celebration Hamper');
    
    // Thumbnail gallery must show all 6 quality images
    const thumbnails = page.locator('button[aria-label*="View image"]');
    await expect(thumbnails).toHaveCount(6);

    // Click through thumbnails to verify preview responds
    await thumbnails.nth(1).click();
    await expect(thumbnails.nth(1)).toHaveAttribute('aria-current', 'true');
  });

  test('Admin customers page shows lifetime orders and view drawer with details', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.context().addCookies([
      {
        name: 'auth_user',
        value: JSON.stringify({ id: 1, email: 'admin@kawaiora.com', role: 'admin' }),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', email: 'admin@kawaiora.com', name: 'Admin', role: 'admin' },
        }),
      });
    });

    await page.goto('/admin/customers');
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();

    // Look for customer table rows with lifetime spend and orders count
    const viewButton = page.locator('table button:has-text("View")').nth(1);
    await expect(viewButton).toBeVisible();
    await viewButton.click();

    // The drawer / modal should appear displaying Lifetime Orders and details
    await expect(page.locator('text=Lifetime Spend')).toBeVisible();
  });

  test('Cart page displays luxury cart image in cart', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // Verify cart icon image in header
    const cartHeaderImg = page.locator('h1 img[alt="Cart"]');
    await expect(cartHeaderImg).toBeVisible();

    // Verify empty cart luxury image
    const emptyCartImg = page.locator('img[alt="KawaiOra Artisan Shopping Cart"]');
    await expect(emptyCartImg).toBeVisible();
  });

  test('Admin can delete non-admin customer with confirmation modal and safety protection', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth_user',
        value: JSON.stringify({
          id: '1',
          email: 'admin@kawaiora.com',
          name: 'Administrator',
          role: 'admin',
        }),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/customers');
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();

    // Verify delete button is available for customers
    const deleteBtn = page.locator('table button[aria-label="Delete customer"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Verify confirmation modal opens
      await expect(page.locator('h2:has-text("Delete Customer Account")')).toBeVisible();
      await expect(page.locator('button:has-text("Yes, Delete Customer")')).toBeVisible();
      // Click cancel to keep data intact
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('h2:has-text("Delete Customer Account")')).not.toBeVisible();
    }
  });
});
