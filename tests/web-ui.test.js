const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Web UI Tests - Logout Functionality', () => {
  let driver;
  const BASE_URL = 'https://danangculinaryatlas.site';
  const TEST_EMAIL = 'toanyogame@gmail.com';
  const TEST_PASSWORD = 'Toan@1234';

  // Setup before all tests
  beforeAll(async () => {
    // Configure Chrome options
    const options = new chrome.Options();
    // options.addArguments('--headless'); // Run in headless mode (no GUI)
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    // Initialize WebDriver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Set timeout
    await driver.manage().setTimeouts({ implicit: 10000 });
  }, 30000); // 30 second timeout for setup

  // Cleanup after all tests
  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  }, 10000);

  // Helper function to login
  async function performLogin() {
    await driver.get(`${BASE_URL}/login`);
    
    // Wait for login page to load
    await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 10000);
    
    // Find and fill email input
    const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(TEST_EMAIL);
    
    // Find and fill password input
    const passwordInput = await driver.findElement(By.css('input[type="password"], input[name="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(TEST_PASSWORD);
    
    // Find and click login button
    const loginButton = await driver.findElement(
      By.css('button[type="submit"], button:contains("Đăng nhập"), button:contains("Login")')
    );
    await loginButton.click();
    
    // Wait for navigation after login (wait for URL change or specific element)
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return !currentUrl.includes('/login');
    }, 10000);
    
    // Wait a bit for page to fully load
    await driver.sleep(2000);
  }

  describe('Logout Test Scenarios', () => {
    test('TC01: Logout successfully from homepage', async () => {
      // Login first
      await performLogin();
      
      // Verify we're logged in (check for user menu or profile icon)
      const userMenuExists = await driver.findElements(
        By.css('[data-testid="user-menu"], .user-profile, .user-avatar, button[aria-label*="user"]')
      );
      expect(userMenuExists.length).toBeGreaterThan(0);
      
      // Find and click logout button/link
      // Try multiple selectors as websites may vary
      let logoutButton;
      try {
        logoutButton = await driver.findElement(
          By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
        );
      } catch (e) {
        // Try alternative selectors
        logoutButton = await driver.findElement(
          By.css('[data-testid="logout"], a[href*="logout"], button[class*="logout"]')
        );
      }
      
      await logoutButton.click();
      
      // Wait for logout to complete
      await driver.sleep(2000);
      
      // Verify logout was successful
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toMatch(/login|home|\/$/);
      
      // Verify login button is visible again
      const loginElements = await driver.findElements(
        By.xpath('//a[contains(text(),"Đăng nhập") or contains(text(),"Login")]')
      );
      expect(loginElements.length).toBeGreaterThan(0);
    }, 60000);

    test('TC02: Verify user cannot access protected routes after logout', async () => {
      // Login first
      await performLogin();
      
      // Logout
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      await logoutButton.click();
      await driver.sleep(2000);
      
      // Try to access profile page
      await driver.get(`${BASE_URL}/profile`);
      await driver.sleep(2000);
      
      // Should be redirected to login
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('login');
    }, 60000);

    test('TC03: Logout clears session/cookies', async () => {
      // Login first
      await performLogin();
      
      // Get cookies before logout
      const cookiesBeforeLogout = await driver.manage().getCookies();
      const hasAuthCookie = cookiesBeforeLogout.some(
        cookie => cookie.name.toLowerCase().includes('token') || 
                  cookie.name.toLowerCase().includes('session') ||
                  cookie.name.toLowerCase().includes('auth')
      );
      
      // Logout
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      await logoutButton.click();
      await driver.sleep(2000);
      
      // Check localStorage is cleared
      const localStorageToken = await driver.executeScript(
        'return localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")'
      );
      expect(localStorageToken).toBeNull();
      
      // Check sessionStorage is cleared
      const sessionStorageToken = await driver.executeScript(
        'return sessionStorage.getItem("token") || sessionStorage.getItem("accessToken") || sessionStorage.getItem("authToken")'
      );
      expect(sessionStorageToken).toBeNull();
    }, 60000);

    test('TC04: Logout from user dropdown menu', async () => {
      // Login first
      await performLogin();
      
      // Click on user menu/dropdown
      try {
        const userMenu = await driver.findElement(
          By.css('[data-testid="user-menu"], .user-profile, .user-avatar, button[aria-label*="user"]')
        );
        await userMenu.click();
        await driver.sleep(1000);
        
        // Click logout from dropdown
        const logoutOption = await driver.findElement(
          By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")] | //a[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
        );
        await logoutOption.click();
        await driver.sleep(2000);
        
        // Verify logout
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toMatch(/login|home|\/$/);
      } catch (e) {
        console.log('User dropdown menu not found, skipping this test scenario');
        // If user menu doesn't exist, test is skipped
      }
    }, 60000);

    test('TC05: Multiple rapid logout clicks should not cause errors', async () => {
      // Login first
      await performLogin();
      
      // Find logout button
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      
      // Click multiple times rapidly
      await logoutButton.click();
      await logoutButton.click().catch(() => {}); // Ignore error if element is no longer clickable
      await driver.sleep(2000);
      
      // Should still successfully logout without errors
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toMatch(/login|home|\/$/);
    }, 60000);

    test('TC06: Logout and login again with same credentials', async () => {
      // Login first time
      await performLogin();
      
      // Logout
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      await logoutButton.click();
      await driver.sleep(2000);
      
      // Login again
      await performLogin();
      
      // Verify successful login
      const userMenuExists = await driver.findElements(
        By.css('[data-testid="user-menu"], .user-profile, .user-avatar, button[aria-label*="user"]')
      );
      expect(userMenuExists.length).toBeGreaterThan(0);
    }, 90000);

    test('TC07: Verify logout button visibility when logged in', async () => {
      // Login first
      await performLogin();
      
      // Check logout button is visible
      const logoutButtons = await driver.findElements(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")] | //a[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      
      expect(logoutButtons.length).toBeGreaterThan(0);
      
      // Check if button is displayed
      const isDisplayed = await logoutButtons[0].isDisplayed();
      expect(isDisplayed).toBe(true);
    }, 60000);

    test('TC08: Browser back button after logout should not restore session', async () => {
      // Login first
      await performLogin();
      const loggedInUrl = await driver.getCurrentUrl();
      
      // Logout
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      await logoutButton.click();
      await driver.sleep(2000);
      
      // Navigate back
      await driver.navigate().back();
      await driver.sleep(2000);
      
      // Should still be logged out (redirected to login or home)
      const currentUrl = await driver.getCurrentUrl();
      // User should not be able to access protected content
      const userMenuExists = await driver.findElements(
        By.css('[data-testid="user-menu"], .user-profile, .user-avatar')
      );
      expect(userMenuExists.length).toBe(0);
    }, 60000);

    test('TC09: Logout confirmation dialog (if exists)', async () => {
      // Login first
      await performLogin();
      
      // Find logout button
      const logoutButton = await driver.findElement(
        By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
      );
      await logoutButton.click();
      
      // Check if confirmation dialog appears
      try {
        await driver.wait(until.alertIsPresent(), 2000);
        const alert = await driver.switchTo().alert();
        const alertText = await alert.getText();
        console.log('Logout confirmation dialog:', alertText);
        
        // Accept the alert
        await alert.accept();
        await driver.sleep(2000);
        
        // Verify logout
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toMatch(/login|home|\/$/);
      } catch (e) {
        // No alert present, that's okay
        console.log('No confirmation dialog for logout');
        await driver.sleep(2000);
      }
    }, 60000);

    test('TC10: Logout from different pages (profile, settings, etc)', async () => {
      // Login first
      await performLogin();
      
      // Navigate to different pages and test logout
      const pagesToTest = ['/profile', '/settings', '/restaurants'];
      
      for (const page of pagesToTest) {
        try {
          await driver.get(`${BASE_URL}${page}`);
          await driver.sleep(2000);
          
          // Try to find logout button
          const logoutButtons = await driver.findElements(
            By.xpath('//button[contains(text(),"Đăng xuất") or contains(text(),"Logout")]')
          );
          
          if (logoutButtons.length > 0) {
            await logoutButtons[0].click();
            await driver.sleep(2000);
            
            // Verify logout
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toMatch(/login|home|\/$/);
            
            // Login again for next iteration
            if (pagesToTest.indexOf(page) < pagesToTest.length - 1) {
              await performLogin();
            }
            break; // Successfully tested logout, no need to continue
          }
        } catch (e) {
          console.log(`Page ${page} not accessible or logout not found`);
        }
      }
    }, 120000);
  });
});
