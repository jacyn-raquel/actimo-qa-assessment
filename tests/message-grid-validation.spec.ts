import { test } from "@playwright/test";
import {
  addGridTileWithUrl,
  assertGridUrlValidation,
  createMessage,
  login,
  saveAndWait,
  uniqueMessageTitle,
  clickFirst,
  fillFirst,
} from "./support/actimo";

test("grid URL action accepts valid input and blocks invalid mailto input", async ({ page }) => {
  const title = uniqueMessageTitle();

  await login(page);
  await createMessage(page, title);
  await addGridTileWithUrl(page, "Learn more", "mailto:not-an-email");
  await assertGridUrlValidation(page);

  await fillFirst(page, [
    'input[placeholder*="mailto" i]',
    'input[placeholder="URL"]',
    'input[name="url"]',
  ], "https://example.com");
  await clickFirst(page, ['button:has-text("Save")']);
  await saveAndWait(page);
});
