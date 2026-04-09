import { expect, test } from "@playwright/test";
import {
  addTextModule,
  createMessage,
  expectPersistedTextModule,
  login,
  reopenMessageFromList,
  saveAndWait,
  uniqueMessageTitle,
} from "./support/actimo";

test("message text content persists after save and reopen", async ({ page }) => {
  const requestedTitle = uniqueMessageTitle();
  const messageText = "Hello #firstname#! Welcome to #company#!";

  await login(page);
  const actualTitle = await createMessage(page, requestedTitle);
  await addTextModule(page, messageText);
  await saveAndWait(page);

  await reopenMessageFromList(page, actualTitle);
  await expect(page.locator(`text=${actualTitle}`).first()).toBeVisible();
  await expectPersistedTextModule(page, messageText);
});
