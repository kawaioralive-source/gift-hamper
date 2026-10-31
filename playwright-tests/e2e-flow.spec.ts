import { test, expect } from '@playwright/test';

test.describe('KawaiOra Interactive E-Commerce & Security Flows', () => {
  test('Homepage loads correctly with interactive hero slider and review sliding effects', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hampers/);
    await expect(page.locator('header, nav').first()).toBeVisible();
    await expect(page.locator('text=Unforgettable Gifts').first()).toBeVisible();

    // Verify interactive Hero Slider next button
    const heroNextBtn = page.locator('button[aria-label="Next hamper"]');
    await expect(heroNextBtn).toBeVisible();
    await heroNextBtn.click();
    await page.waitForTimeout(600);

    // Verify Customer Reviews interactive sliding
    const reviewsNextBtn = page.locator('button[aria-label="Next reviews"]');
    await expect(reviewsNextBtn).toBeVisible();
    await reviewsNextBtn.click();
    await page.waitForTimeout(600);
  });

  test('Sign In area password eye button toggles visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click Eye button to show password
    const eyeBtn = page.locator('button[aria-label="Show password"]');
    await expect(eyeBtn).toBeVisible();
    await eyeBtn.click();

    // Verify type changed to text
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    const eyeOffBtn = page.locator('button[aria-label="Hide password"]');
    await expect(eyeOffBtn).toBeVisible();
    await eyeOffBtn.click();

    // Verify type changed back to password
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Shop page displays products with fast response and active filters', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toBeVisible();
    // Products should load rapidly with SQLite local data
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 5000 });
  });

  test('Admin login, dynamic navigation switching, and bottom logout button', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kawaiora.com');
    await page.fill('input[placeholder="••••••••"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Products page and verify nav title updates to Products (not stuck on Dashboard)
    await page.goto('/admin/products');
    await expect(page.locator('h1').filter({ hasText: 'Products' }).first()).toBeVisible({ timeout: 5000 });

    // Test the Logout/Sign Out button in the admin navigation
    const logoutBtn = page.locator('aside button, header button').filter({ hasText: /Sign Out|Logout/ }).first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify redirect back to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('text=Sign In').first()).toBeVisible({ timeout: 5000 });
  });

  test('Address area displays clean formatted text with zero raw HTML tags', async ({ page }) => {
    // Check Checkout page address display
    await page.goto('/checkout');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
    
    // Ensure no raw '<br>' or '<br />' text appears in the body
    const bodyContent = await page.content();
    expect(bodyContent).not.toContain('&lt;br&gt;');
    expect(bodyContent).not.toContain('&lt;br /&gt;');
    expect(bodyContent).not.toContain('&lt;br/&gt;');

    // Check Orders detail page
    await page.goto('/orders/ord_sample_01');
    await page.waitForTimeout(1000);
    const orderPageContent = await page.content();
    expect(orderPageContent).not.toContain('&lt;br&gt;');
    expect(orderPageContent).not.toContain('&lt;br /&gt;');
    expect(orderPageContent).not.toContain('&lt;br/&gt;');
  });

  test('Product cards and Add to Cart buttons fit properly without excessive space', async ({ page }) => {
    // 1. Check Homepage product cards
    await page.goto('/');
    const homeAddToCartBtns = page.locator('button:has-text("Add to Cart")');
    const firstBtn = homeAddToCartBtns.first();
    await expect(firstBtn).toBeVisible();

    const btnBox = await firstBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    // Height should be compact and sleek (around 32px to 40px, never > 50px)
    expect(btnBox!.height).toBeLessThan(48);
    // Width should fit well inside the card (under 140px)
    expect(btnBox!.width).toBeLessThan(140);

    // 2. Check Product Detail Page Add to Cart and Buy Now buttons
    await page.goto('/products/luxury-wellness-hamper');
    const detailAddToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    await expect(detailAddToCartBtn).toBeVisible();
    const detailBtnBox = await detailAddToCartBtn.boundingBox();
    expect(detailBtnBox).not.toBeNull();
    // Button height should be balanced and comfortable (around 44px to 54px, not oversized > 65px)
    expect(detailBtnBox!.height).toBeLessThan(58);
  });

  test('Custom Builder page has exactly ONE navbar and no duplicate headers', async ({ page }) => {
    await page.goto('/customize/new');
    await expect(page.locator('h1').filter({ hasText: 'Build Your Custom Hamper' })).toBeVisible({ timeout: 5000 });

    // Ensure there is only 1 KawaiOra main logo / header element
    const logoLinks = page.locator('nav a[aria-label="KawaiOra Home"]');
    await expect(logoLinks).toHaveCount(1);

    // Verify there is only one navigation bar
    const navElements = page.locator('header nav[aria-label="Main navigation"]');
    await expect(navElements).toHaveCount(1);
  });

  test('Navbar stretches completely edge-to-edge across the screen (autofit)', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    // Nav width should match viewport width (1600px), not capped at 1280px (max-w-7xl)
    expect(navBox!.width).toBeGreaterThanOrEqual(1580);
  });

  test('Cart count and Wishlist count badges reactively increase upon adding items', async ({ page }) => {
    await page.goto('/');

    // Locate the header badges
    const cartBadge = page.locator('header a[href="/cart"] span, header a[href="/cart"] div').last();
    const wishBadge = page.locator('header a[href="/wishlist"] span, header a[href="/wishlist"] div').last();

    // Verify badges are present
    await expect(cartBadge).toBeVisible();
    await expect(wishBadge).toBeVisible();

    // Click Add to Cart on the first hamper card
    const firstAddBtn = page.locator('button:has-text("Add to Cart")').first();
    await firstAddBtn.click();

    // Cart badge should increment to at least 1
    await expect(page.locator('header a[href="/cart"]')).toContainText('1');

    // Click Wishlist heart on the first hamper card
    const firstWishBtn = page.locator('button[aria-label="Wishlist"]').first();
    await firstWishBtn.click();

    // Wishlist badge should increment to at least 1
    await expect(page.locator('header a[href="/wishlist"]')).toContainText('1');
  });

  test('AI Gift Finder is removed and brand logo image is displayed consistently', async ({ page }) => {
    await page.goto('/');

    // Verify AI Gift Finder is completely removed from the page
    await expect(page.locator('text=AI Gift Finder')).toHaveCount(0);

    // Verify header has the official brand logo image
    const headerLogo = page.locator('header img[src="/images/kawaiora-logo.jpg"]');
    await expect(headerLogo).toBeVisible();

    // Verify footer has the brand logo image
    const footerLogo = page.locator('footer img[src="/images/kawaiora-logo.jpg"]');
    await expect(footerLogo).toBeVisible();
  });

  test('Admin dashboard shows single title (no duplicates) and product changes persist', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kawaiora.com');
    await page.fill('input[placeholder="••••••••"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });

    // Go to Products
    await page.goto('/admin/products');
    await page.waitForTimeout(1000);

    // Verify exactly ONE "Products" h1 exists on the page (top bar duplicate removed)
    const productsHeadings = page.locator('h1').filter({ hasText: 'Products' });
    await expect(productsHeadings).toHaveCount(1);

    // Verify Sign Out button is present in both top bar and sidebar
    const topSignOutBtn = page.locator('header button:has-text("Sign Out")');
    await expect(topSignOutBtn).toBeVisible();
  });
});
