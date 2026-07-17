import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUrl = `file://${path.resolve(__dirname, '../index.html')}`;

test.describe('Odin Tic-Tac-Toe Game Automation Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept native browser prompts cleanly before they can block the pipeline thread
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        if (dialog.message().includes('player one')) {
          await dialog.accept('X-Man');
        } else {
          await dialog.accept('O-Mega');
        }
      }
    });
    
    await page.goto(localUrl);
  });

  test('should verify initial layout structure and grid architecture', async ({ page }) => {
    const gameboard = page.locator('#gameboard');
    await expect(gameboard).toBeVisible();

    const spaces = page.locator('.player-space');
    await expect(spaces).toHaveCount(9);

    const startBtn = page.locator('#start-button');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText('Start Game');
  });

  test('should dynamically execute a game matching the starting player to a victory', async ({ page }) => {
    await page.locator('#start-button').click();

    const turnText = await page.locator('#now-playing').textContent();
    const isXFirst = turnText.includes('(X)');

    if (isXFirst) {
      await page.locator('[id="0"]').click();
      await page.locator('[id="3"]').click();
      await page.locator('[id="1"]').click();
      await page.locator('[id="4"]').click();
      await page.locator('[id="2"]').click(); 
    } else {
      await page.locator('[id="0"]').click();
      await page.locator('[id="3"]').click();
      await page.locator('[id="1"]').click();
      await page.locator('[id="4"]').click();
      await page.locator('[id="2"]').click(); 
    }

    const winNotice = page.locator('#win-notice');
    await expect(winNotice).toBeVisible();
    await expect(winNotice).toContainText(/Wins!/);
  });

  test('should protect claimed grid squares from being overwritten', async ({ page }) => {
    await page.locator('#start-button').click();

    const centerTile = page.locator('[id="4"]');
    await centerTile.click(); 

    const initialMark = await centerTile.textContent();
    expect(initialMark).not.toBe('');

    await centerTile.click();
    const secondaryMark = await centerTile.textContent();
    expect(initialMark).toEqual(secondaryMark);
  });

  // EXPANDED PORTFOLIO COVERAGE 1: Alternating Turn Order Verification
  test('should alternate active turns and update the header tracker responsively', async ({ page }) => {
    await page.locator('#start-button').click();
    
    const turnHeader = page.locator('#now-playing');
    const firstTurnText = await turnHeader.textContent();
    
    // Tap the upper-left grid location to use up the current player's action
    await page.locator('[id="0"]').click();
    
    const secondTurnText = await turnHeader.textContent();
    expect(firstTurnText).not.toEqual(secondTurnText);
  });

  // EXPANDED PORTFOLIO COVERAGE 2: Stalemate Full Simulation Loop
  test('should gracefully handle a complete stalemate scenario with proper styling', async ({ page }) => {
    await page.locator('#start-button').click();
    
    const turnText = await page.locator('#now-playing').textContent();
    const isXFirst = turnText.includes('(X)');

    // Execute a reliable 9-move stalemate grid pattern:
    // X X O
    // O O X
    // X X O
    const moves = [0, 2, 1, 3, 5, 4, 6, 8, 7];
    
    for (const moveId of moves) {
      await page.locator(`[id="${moveId}"]`).click();
    }

    const winNotice = page.locator('#win-notice');
    await expect(winNotice).toBeVisible();
    await expect(winNotice).toHaveText("It's a Stalemate!");
    
    // Assert the special orange/gold color styling rule applies to the text node
    await expect(winNotice).toHaveCSS('color', 'rgb(245, 158, 11)'); 
  });

  // EXPANDED PORTFOLIO COVERAGE 3: State Verification Post Soft-Reset
  test('should completely flush application memory and layout states upon clicking play again', async ({ page }) => {
    await page.locator('#start-button').click();
    
    // Run an instant victory sequence to force the reset button onto the screen
    await page.locator('[id="0"]').click();
    await page.locator('[id="3"]').click();
    await page.locator('[id="1"]').click();
    await page.locator('[id="4"]').click();
    await page.locator('[id="2"]').click();

    // Click the soft-reset button
    await page.locator('#reset-button').click();

    // Assert the UI rolls back cleanly to its entry parameters without structural damage
    await expect(page.locator('#start-button')).toBeVisible();
    await expect(page.locator('#win-notice')).not.toBeVisible();

    // Check that every grid tile has been reset to empty string values
    const spaces = page.locator('.player-space');
    const count = await spaces.count();
    for (let i = 0; i < count; i++) {
      await expect(spaces.nth(i)).toHaveText('');
    }
  });
});