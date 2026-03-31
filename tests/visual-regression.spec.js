// @ts-check
const { test, expect } = require('@playwright/test');

// ─── Configuration ───────────────────────────────────────────
const SCREENSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.06,
  threshold: 0.3,
  animations: 'disabled',
};

const TABS = [
  { name: 'today',  selector: '.bni[data-v="today"]' },
  { name: 'record', selector: '.bni[data-v="record"]' },
  { name: 'report', selector: '.bni[data-v="report"]' },
  { name: 'forge',  selector: '.bni[data-v="forge"]' },
];

// ─── Helper: navigate to a tab and wait for render ───────────
async function navigateToTab(page, tab) {
  if (tab.name !== 'today') {
    await page.click(tab.selector);
  }
  await page.waitForTimeout(800);
}

// ─── 1. SCREENSHOT TESTS ────────────────────────────────────
test.describe('Visual Regression - Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('gc:gc:onboarded', '1');
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  for (const tab of TABS) {
    test(`${tab.name} tab matches baseline`, async ({ page }) => {
      await navigateToTab(page, tab);

      await expect(page).toHaveScreenshot(`${tab.name}-tab.png`, {
        ...SCREENSHOT_OPTIONS,
        fullPage: false,
      });
    });
  }
});

// ─── 2. LAYOUT INTEGRITY ────────────────────────────────────
test.describe('Layout Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('gc:gc:onboarded', '1');
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('header stays within viewport width', async ({ page }) => {
    const headerBox = await page.locator('.hdr').boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox.width).toBeLessThanOrEqual(390);
    expect(headerBox.x).toBeGreaterThanOrEqual(0);
  });

  test('bottom nav stays fixed at bottom', async ({ page }) => {
    const navBox = await page.locator('.bnav').boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox.y + navBox.height).toBeGreaterThanOrEqual(840);
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(850);
    expect(navBox.width).toBeLessThanOrEqual(430);
  });

  test('no visible horizontal overflow on any tab', async ({ page }) => {
    for (const tab of TABS) {
      await navigateToTab(page, tab);

      const overflow = await page.evaluate(() => {
        var docEl = document.documentElement;
        var results = [];

        // Check page-level horizontal overflow (the user-visible kind)
        if (docEl.scrollWidth > docEl.clientWidth + 2) {
          results.push('page overflows: scrollWidth=' + docEl.scrollWidth + ' > clientWidth=' + docEl.clientWidth);
        }

        // Check elements with visible overflow (not hidden/clip)
        var els = document.querySelectorAll('#app, #content, .content');
        els.forEach(function(el) {
          var style = window.getComputedStyle(el);
          var overflowX = style.overflowX;
          if (overflowX === 'visible' || overflowX === 'auto' || overflowX === 'scroll') {
            if (el.scrollWidth > el.clientWidth + 2) {
              results.push((el.id || el.className) + ' visibly overflows: scrollWidth=' + el.scrollWidth + ' > clientWidth=' + el.clientWidth);
            }
          }
        });

        return results;
      });

      expect(overflow, 'Overflow detected on ' + tab.name + ' tab').toEqual([]);
    }
  });

  test('score cards do not overlap on today tab', async ({ page }) => {
    const cards = page.locator('.scrow .sc');
    const count = await cards.count();

    if (count >= 2) {
      const boxes = [];
      for (var i = 0; i < count; i++) {
        boxes.push(await cards.nth(i).boundingBox());
      }

      for (var j = 0; j < boxes.length - 1; j++) {
        var rightEdge = boxes[j].x + boxes[j].width;
        var nextLeft = boxes[j + 1].x;
        expect(rightEdge).toBeLessThanOrEqual(nextLeft + 2);
      }
    }
  });
});

// ─── 3. REQUIRED ELEMENTS ───────────────────────────────────
test.describe('Required Elements Present', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('gc:gc:onboarded', '1');
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('header has all required elements', async ({ page }) => {
    await expect(page.locator('.hdr')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.sbadge')).toBeVisible();
  });

  test('bottom nav has all 4 tab buttons', async ({ page }) => {
    await expect(page.locator('.bnav')).toBeVisible();
    for (const tab of TABS) {
      await expect(page.locator(tab.selector)).toBeVisible();
    }
  });

  test('today tab has required structure', async ({ page }) => {
    await expect(page.locator('#content')).toBeVisible();
    await expect(page.locator('.scrow')).toBeVisible();
    await expect(page.locator('.fab')).toBeVisible();
  });

  test('record tab has content', async ({ page }) => {
    await navigateToTab(page, TABS[1]);
    const content = page.locator('#content');
    await expect(content).toBeVisible();
    const childCount = await content.evaluate(function(el) { return el.children.length; });
    expect(childCount).toBeGreaterThan(0);
  });

  test('report tab has content', async ({ page }) => {
    await navigateToTab(page, TABS[2]);
    const content = page.locator('#content');
    await expect(content).toBeVisible();
    const childCount = await content.evaluate(function(el) { return el.children.length; });
    expect(childCount).toBeGreaterThan(0);
  });

  test('forge tab has content', async ({ page }) => {
    await navigateToTab(page, TABS[3]);
    const content = page.locator('#content');
    await expect(content).toBeVisible();
    const childCount = await content.evaluate(function(el) { return el.children.length; });
    expect(childCount).toBeGreaterThan(0);
  });

  test('FAB button is visible and tappable', async ({ page }) => {
    const fab = page.locator('.fab');
    await expect(fab).toBeVisible();

    // Verify the FAB is within the viewport
    const fabBox = await fab.boundingBox();
    expect(fabBox).not.toBeNull();
    expect(fabBox.x).toBeGreaterThanOrEqual(0);
    expect(fabBox.y).toBeGreaterThanOrEqual(0);
    expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(390);
    expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(844);
  });
});
