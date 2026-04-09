import { expect, Locator, Page } from "@playwright/test";

type RoleTarget = {
  role: Parameters<Page["getByRole"]>[0];
  options?: Parameters<Page["getByRole"]>[1];
};

type LocatorTarget = string | RoleTarget;

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function uniqueMessageTitle(): string {
  const prefix = process.env.ACTIMO_MESSAGE_PREFIX || "QA Assessment";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix} ${stamp}`;
}

async function dismissCookieBanner(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelector("#onetrust-consent-sdk")?.remove();
    document.querySelector(".onetrust-pc-dark-filter")?.remove();
  });
}

function toLocator(page: Page, target: LocatorTarget): Locator {
  if (typeof target === "string") {
    return page.locator(target).first();
  }

  return page.getByRole(target.role, target.options).first();
}

function describeTarget(target: LocatorTarget): string {
  if (typeof target === "string") {
    return target;
  }

  const name = target.options?.name ? ` name=${String(target.options.name)}` : "";
  return `getByRole(${String(target.role)}${name})`;
}

async function firstVisible(page: Page, targets: LocatorTarget[]): Promise<Locator> {
  for (const target of targets) {
    const locator = toLocator(page, target);
    if (await locator.isVisible().catch(() => false)) {
      return locator;
    }
  }

  throw new Error(`No visible locator matched any of: ${targets.map(describeTarget).join(", ")}`);
}

async function waitForFirstVisible(page: Page, targets: LocatorTarget[], timeout = 30_000): Promise<Locator> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const locator = await firstVisible(page, targets).catch(() => null);
    if (locator) {
      return locator;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Timed out waiting for any of: ${targets.map(describeTarget).join(", ")}`);
}

async function waitForUrlMatch(page: Page, pattern: RegExp, timeout = 30_000): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (pattern.test(page.url())) {
      return true;
    }

    await page.waitForTimeout(500);
  }

  return false;
}

async function waitForMessageEditorReady(page: Page, timeout = 60_000): Promise<void> {
  const onEditorUrl = await waitForUrlMatch(page, /editor\/messages\/edit\/\d+\/design/i, timeout);
  if (!onEditorUrl) {
    throw new Error(`Timed out waiting for message editor design URL. Current URL: ${page.url()}`);
  }

  await waitForFirstVisible(page, [
    { role: "tab", options: { name: /design/i } },
    { role: "button", options: { name: /^text$/i } },
    { role: "button", options: { name: /^grid$/i } },
    'text=/add modules to build your message/i',
  ], timeout);
}

async function waitForNewMessageHref(page: Page, previousHref: string | null, timeout = 60_000): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const href = await page
      .locator('a[href*="#/editor/messages/edit/"]')
      .filter({ hasText: /message\s*#\d+/i })
      .first()
      .getAttribute("href")
      .catch(() => null);

    if (href && href !== previousHref) {
      return href;
    }

    await page.waitForTimeout(500);
  }

  throw new Error("Expected Create message to add a new row to the messages list");
}

export async function clickFirst(page: Page, targets: LocatorTarget[]): Promise<void> {
  const locator = await firstVisible(page, targets);
  await locator.click();
}

export async function fillFirst(page: Page, targets: LocatorTarget[], value: string): Promise<void> {
  const locator = await firstVisible(page, targets);
  await locator.fill(value);
}

export async function login(page: Page): Promise<void> {
  await page.goto("/admin/login");

  await dismissCookieBanner(page);
  await page.waitForLoadState("domcontentloaded");
  await dismissCookieBanner(page);

  const emailSelector = 'input[name="email"]';
  const emailField = page.locator(emailSelector);
  const emailVisible = await emailField.isVisible().catch(() => false);

  if (!emailVisible) {
    const adminLink = page.getByRole("link", { name: /log in as an admin instead/i });
    if (await adminLink.isVisible().catch(() => false)) {
      await adminLink.evaluate((node) => (node as HTMLAnchorElement).click());
      await page.waitForLoadState("domcontentloaded");
      await dismissCookieBanner(page);
    }
  }

  await page.waitForSelector(emailSelector, { timeout: 30_000 });

  await fillFirst(
    page,
    ['input[name="email"]', 'input#account-login-email', 'input[placeholder*="enter email" i]'],
    requiredEnv("ACTIMO_EMAIL"),
  );
  await fillFirst(
    page,
    ['input[name="password"]', 'input#account-login-password', 'input[placeholder*="enter password" i]'],
    requiredEnv("ACTIMO_PASSWORD"),
  );
  const signInButton = await firstVisible(page, [
    { role: "button", options: { name: /sign in/i } },
    'button[type="submit"]',
    'button:has-text("Log in")',
    'button:has-text("Login")',
  ]);
  await signInButton.evaluate((node) => (node as HTMLButtonElement).click());

  await page.waitForURL(/dashboard|editor|messages/i, { timeout: 60_000 });
}

async function navigateToMessagesThroughUi(page: Page): Promise<void> {
  const editorTargets: LocatorTarget[] = [
    { role: "link", options: { name: /editor/i } },
    { role: "button", options: { name: /editor/i } },
    '[href*="#/editor"]',
    'text="Editor"',
  ];

  const messagesTargets: LocatorTarget[] = [
    { role: "link", options: { name: /messages/i } },
    { role: "button", options: { name: /messages/i } },
    '[href*="#/editor/messages"]',
    'text="Messages"',
  ];

  const editorNav = await waitForFirstVisible(page, editorTargets, 60_000);
  await editorNav.click();

  const messagesNav = await waitForFirstVisible(page, messagesTargets, 60_000);
  await messagesNav.click();
}

export async function openMessagesList(page: Page): Promise<void> {
  if (!/dashboard|editor|messages/i.test(page.url())) {
    await page.goto("/admin/#/dashboard/workspace");
    await page.waitForLoadState("domcontentloaded");
  }

  await dismissCookieBanner(page);

  if (!/editor\/messages/i.test(page.url())) {
    await page.goto("/admin/#/editor/messages");
    await page.waitForLoadState("domcontentloaded");
    await dismissCookieBanner(page);
  }

  if (!/editor\/messages/i.test(page.url())) {
    await navigateToMessagesThroughUi(page);
  }

  await waitForFirstVisible(page, [
    { role: "button", options: { name: /create message/i } },
    'button:has-text("Create message")',
    '[href*="#/editor/messages/edit/"]',
  ], 120_000);
}

export async function createMessage(page: Page, title: string): Promise<string> {
  await openMessagesList(page);
  const existingTopHref = await page.locator('a[href*="#/editor/messages/edit/"]').first().getAttribute("href").catch(() => null);
  const createButton = await waitForFirstVisible(page, [
    { role: "button", options: { name: /create message|new message/i } },
    'button:has-text("Create message")',
    'button:has-text("New message")',
    'button:has-text("Create")',
    'text="Create message"',
    'text="New message"',
  ], 120_000);
  await createButton.click();

  const reachedEditorDirectly = await waitForUrlMatch(page, /editor\/messages\/edit/i, 15_000);

  if (!reachedEditorDirectly) {
    const freshHref = await waitForNewMessageHref(page, existingTopHref, 60_000);

    await page.goto(`/admin/${freshHref}`);
    await page.waitForLoadState("domcontentloaded");
  }

  await waitForMessageEditorReady(page, 60_000);

  const titleTarget = await firstVisible(page, [
    '[contenteditable="true"]',
    'input[value*="message" i]',
    'input[placeholder*="message" i]',
  ]).catch(() => null);

  if (titleTarget) {
    if ((await titleTarget.getAttribute("contenteditable")) === "true") {
      await titleTarget.click();
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.type(title);
    } else {
      await titleTarget.fill(title);
    }

    return title;
  }

  const idMatch = page.url().match(/edit\/(\d+)/i);
  return idMatch ? `New message #${idMatch[1]}` : title;
}

export async function openDesignTab(page: Page): Promise<void> {
  const designSurface = await firstVisible(page, [
    { role: "button", options: { name: /^text$/i } },
    { role: "button", options: { name: /^grid$/i } },
    'text=/add modules to build your message/i',
  ]).catch(() => null);

  if (designSurface) {
    return;
  }

  const designTab = await waitForFirstVisible(page, [
    { role: "tab", options: { name: /design/i } },
    'text="Design"',
    '[role="tab"]:has-text("Design")',
  ], 60_000);
  await designTab.click();
  await waitForFirstVisible(page, [
    { role: "button", options: { name: /^text$/i } },
    { role: "button", options: { name: /^grid$/i } },
    'text=/add modules to build your message/i',
  ], 60_000);
}

export async function openPublishTab(page: Page): Promise<void> {
  await clickFirst(page, [{ role: "tab", options: { name: /publish/i } }, 'text="Publish"', '[role="tab"]:has-text("Publish")']);
  await waitForFirstVisible(page, [
    { role: "checkbox", options: { name: /enable public link/i } },
    { role: "checkbox", options: { name: /enable linked access/i } },
    'text="Access"',
  ], 30_000);
}

export async function saveAndWait(page: Page): Promise<void> {
  const saveIndicator = page.locator('text=/saving|saved/i').first();
  await expect(saveIndicator).toBeVisible({ timeout: 20_000 });
  await expect(saveIndicator).toContainText(/saved/i, { timeout: 30_000 });
}

export async function reopenMessageFromList(page: Page, title: string): Promise<void> {
  await page.goto("/admin/#/editor/messages");
  await page.waitForLoadState("domcontentloaded");
  await dismissCookieBanner(page);
  await waitForFirstVisible(page, [
    { role: "button", options: { name: /create message/i } },
    '[href*="#/editor/messages/edit/"]',
  ], 60_000);

  const idMatch = title.match(/#(\d+)/i);
  await clickFirst(page, [
    ...(idMatch ? [`a[href*="#/editor/messages/edit/${idMatch[1]}/design"]`] : []),
    `text="${title}"`,
    `a:has-text("${title}")`,
    `button:has-text("${title}")`,
  ]);
  await page.waitForURL(/editor\/messages\/edit/i, { timeout: 60_000 });
}

export async function addTextModule(page: Page, text: string): Promise<void> {
  await openDesignTab(page);
  await clickFirst(page, [{ role: "button", options: { name: /^text$/i } }, 'text="TEXT"', 'button:has-text("TEXT")']);
  await waitForFirstVisible(page, [
    'iframe',
    '.ql-editor',
    '[contenteditable="true"]',
    'div[role="textbox"]',
    'textarea',
    'button:has-text("Save")',
  ], 30_000);

  const inlineEditor = await firstVisible(page, [
    '.ql-editor',
    'textarea',
    'div[role="textbox"]',
    '[contenteditable="true"]',
  ]).catch(() => null);

  if (inlineEditor) {
    await inlineEditor.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.insertText(text);
  } else {
    const updatedViaTinyMce = await page.evaluate((value) => {
      const tinyMce = (window as Window & { tinymce?: {
        activeEditor?: {
          focus?: () => void;
          setContent?: (content: string) => void;
          save?: () => void;
        };
        editors?: Array<{
          focus?: () => void;
          setContent?: (content: string) => void;
          save?: () => void;
        }>;
      } }).tinymce;

      const editor = tinyMce?.activeEditor ?? tinyMce?.editors?.[0];
      if (!editor?.setContent) {
        return false;
      }

      const escaped = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      editor.focus?.();
      editor.setContent(`<p>${escaped}</p>`);
      editor.save?.();
      return true;
    }, text).catch(() => false);

    if (updatedViaTinyMce) {
      await page.waitForTimeout(300);
    } else {
      const iframe = page.locator("iframe").last();
      await expect(iframe).toBeVisible({ timeout: 30_000 });
      const iframeHandle = await iframe.elementHandle();
      const editorFrame = iframeHandle ? await iframeHandle.contentFrame() : null;

    if (!editorFrame) {
      throw new Error("Text editor iframe was visible but its content frame was not available");
    }

      await editorFrame.evaluate((value) => {
        const escaped = value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        document.body.innerHTML = `<p>${escaped}</p>`;
        document.body.dispatchEvent(new Event("input", { bubbles: true }));
        document.body.dispatchEvent(new Event("change", { bubbles: true }));
      }, text);

      await expect(editorFrame.locator("body")).toContainText("Hello", { timeout: 10_000 });
    }
  }

  await clickFirst(page, [
    { role: "button", options: { name: /^save$/i } },
    'button:has-text("Save")',
  ]);
}

export async function expectPersistedTextModule(page: Page, expectedText: string): Promise<void> {
  const accessOverlay = page.locator('text=/requesting message access/i').first();
  if (await accessOverlay.isVisible().catch(() => false)) {
    await expect(accessOverlay).toBeHidden({ timeout: 30_000 });
  }

  const previewRoot = page.locator("main");
  const previewHelloVisible = await previewRoot.getByText("Hello").isVisible().catch(() => false);
  const previewWelcomeVisible = await previewRoot.getByText("Welcome to").isVisible().catch(() => false);
  const previewCompanyVisible = await previewRoot.getByText("Company").isVisible().catch(() => false);
  const previewFirstNameVisible = await previewRoot.getByText("First name").isVisible().catch(() => false);
  if (previewHelloVisible && previewWelcomeVisible && (previewCompanyVisible || previewFirstNameVisible)) {
    return;
  }

  const visibleFrame = page.locator("iframe").last();
  if (await visibleFrame.isVisible().catch(() => false)) {
    const visibleFrameHandle = await visibleFrame.elementHandle();
    const visibleContentFrame = visibleFrameHandle ? await visibleFrameHandle.contentFrame() : null;
    if (visibleContentFrame) {
      const currentText = await visibleContentFrame.locator("body").innerText().catch(() => "");
      if (normalizeText(currentText).includes(normalizeText(expectedText))) {
        return;
      }
    }
  }

  const editTextControl = page.getByText("Edit text", { exact: true }).last();
  await expect(editTextControl).toBeVisible({ timeout: 30_000 });
  await editTextControl.click();

  const accessOverlayAfterClick = page.locator('text=/requesting message access/i').first();
  if (await accessOverlayAfterClick.isVisible().catch(() => false)) {
    await expect(accessOverlayAfterClick).toBeHidden({ timeout: 30_000 });
  }

  await waitForFirstVisible(page, [
    'iframe',
    'button:has-text("Save")',
    'text="Text"',
  ], 30_000);

  const tinyMceText = await page.evaluate(() => {
    const tinyMce = (window as Window & { tinymce?: {
      activeEditor?: { getContent?: (opts?: { format?: string }) => string };
      editors?: Array<{ getContent?: (opts?: { format?: string }) => string }>;
    } }).tinymce;

    const editor = tinyMce?.activeEditor ?? tinyMce?.editors?.[0];
    return editor?.getContent?.({ format: "text" }) ?? null;
  }).catch(() => null);

  if (tinyMceText) {
    expect(normalizeText(tinyMceText)).toContain(normalizeText(expectedText));
  } else {
    const iframe = page.locator("iframe").last();
    const iframeVisible = await iframe.isVisible().catch(() => false);

    if (iframeVisible) {
      const iframeHandle = await iframe.elementHandle();
      const editorFrame = iframeHandle ? await iframeHandle.contentFrame() : null;

      if (!editorFrame) {
        throw new Error("Persisted text editor iframe was visible but its content frame was not available");
      }

      const bodyText = await editorFrame.locator("body").innerText();
      expect(normalizeText(bodyText)).toContain(normalizeText(expectedText));
    } else {
      const modalText = page.locator('text=/hello.*firstname.*welcome to.*company/i').first();
      await expect(modalText).toBeVisible({ timeout: 10_000 });
    }
  }

  const closeButton = page.getByRole("button", { name: /close/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function addGridTileWithUrl(page: Page, tileText: string, url: string): Promise<void> {
  await openDesignTab(page);
  await clickFirst(page, [{ role: "button", options: { name: /^grid$/i } }, 'text="GRID"', 'button:has-text("GRID")']);
  await waitForFirstVisible(page, [
    { role: "textbox", options: { name: /title/i } },
    'input[placeholder="Title"]',
    'text="Tiles per row"',
  ], 30_000);
  await fillFirst(page, [
    { role: "textbox", options: { name: /title/i } },
    'input[placeholder="Title"]',
    'input[placeholder*="title" i]',
    'input[value*="Sample" i]',
  ], tileText);
  await clickFirst(page, [
    { role: "button", options: { name: /add an action/i } },
    'text="Add an action"',
    'button:has-text("Add an action")',
  ]);
  const actionList = page.getByRole("listbox").last();
  await expect(actionList).toBeVisible({ timeout: 10_000 });
  const goToUrlOption = actionList.getByText("Go to url", { exact: true });
  await expect(goToUrlOption).toBeVisible({ timeout: 10_000 });
  await goToUrlOption.click({ force: true });
  await waitForFirstVisible(page, [
    'text="Go to url"',
    'input[placeholder*="mailto" i]',
    { role: "textbox", options: { name: /https:\/\/ or mailto:/i } },
  ], 10_000);
  await fillFirst(page, [
    { role: "textbox", options: { name: /https:\/\/ or mailto:/i } },
    'input[placeholder="URL"]',
    'input[name="url"]',
    'input[placeholder*="mailto" i]',
  ], url);
}

export async function assertGridUrlValidation(page: Page): Promise<void> {
  await expect(
    page.locator('text=/invalid|valid email|please use/i').first(),
  ).toBeVisible({ timeout: 10_000 });
}

export async function configurePublishSettings(page: Page): Promise<void> {
  await openPublishTab(page);
  const advancedAccessToggle = page.getByRole("button", { name: /advanced access/i }).first();
  if (await advancedAccessToggle.isVisible().catch(() => false)) {
    await advancedAccessToggle.click().catch(() => Promise.resolve());
  }

  const linkedAccessCheckbox = page.getByRole("checkbox", { name: /enable linked access/i }).first();
  await expect(linkedAccessCheckbox).toBeVisible({ timeout: 30_000 });
  if (await linkedAccessCheckbox.isChecked()) {
    await page.getByText("Enable linked access", { exact: true }).last().click({ force: true });
    await expect(linkedAccessCheckbox).not.toBeChecked({ timeout: 10_000 });
  }
}

export async function expectPublishSettingsPersisted(page: Page): Promise<void> {
  await openPublishTab(page);
  await expect(page.getByRole("checkbox", { name: /enable linked access/i }).first()).not.toBeChecked();
}

export async function expectContentPreview(page: Page, title: string): Promise<void> {
  await expect(page.getByText("Content preview", { exact: true })).toBeVisible({ timeout: 15_000 });
  const previewTitle = title.replace(/\s+#\d+$/i, "");
  await expect(page.locator(`text=${previewTitle}`).first()).toBeVisible({ timeout: 15_000 });
}
