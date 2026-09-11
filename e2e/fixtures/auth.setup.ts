import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import * as fs from "fs";
import * as path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate with PIN and save storage state", async ({ page }) => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const loginPage = new LoginPage(page);
  await loginPage.login("1234");

  // Aguarda que o cabeçalho do quadro de pedidos carregue
  await expect(page.locator(".board-header h1")).toHaveText("Pedidos", { timeout: 15000 });

  // Salva estado de autenticação (localStorage)
  await page.context().storageState({ path: authFile });
});
