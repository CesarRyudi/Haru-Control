import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright para Haru Control (Mobile-First)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4200",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // 1. Setup de Autenticação (executa o login com PIN e salva em .auth/user.json)
    {
      name: "setup",
      testMatch: /fixtures\/auth\.setup\.ts/,
      use: {
        ...devices["Pixel 7"],
      },
    },
    // 2. Testes da Tela de Login (não usam sessão prévia)
    {
      name: "mobile-unauthenticated",
      testMatch: /specs\/01-auth\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
      },
    },
    // 3. Testes Principais Mobile (Pixel 7) - iniciam logados
    {
      name: "mobile-chrome",
      testMatch: /specs\/(?!01-auth).*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 7"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],

  // Inicia automaticamente o backend e frontend se não estiverem rodando
  webServer: [
    {
      command: "npx nx serve api",
      url: "http://localhost:3000/products",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "npx nx serve mobile",
      url: "http://localhost:4200",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
