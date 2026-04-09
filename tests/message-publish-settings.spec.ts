import { test } from "@playwright/test";
import {
  configurePublishSettings,
  expectPublishSettingsPersisted,
  createMessage,
  expectContentPreview,
  login,
  openPublishTab,
  reopenMessageFromList,
  uniqueMessageTitle,
} from "./support/actimo";

test("publish settings remain configured after save and reopen", async ({ page }) => {
  const requestedTitle = uniqueMessageTitle();

  await login(page);
  const actualTitle = await createMessage(page, requestedTitle);
  await openPublishTab(page);
  await expectContentPreview(page, actualTitle);
  await configurePublishSettings(page);

  await reopenMessageFromList(page, actualTitle);
  await expectPublishSettingsPersisted(page);
  await expectContentPreview(page, actualTitle);
});
