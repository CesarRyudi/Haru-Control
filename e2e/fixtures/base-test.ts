import { test as baseTest, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { OrderBoardPage } from "../page-objects/OrderBoardPage";
import { OrderFormPage } from "../page-objects/OrderFormPage";
import { OrderHistoryPage } from "../page-objects/OrderHistoryPage";

type HaruFixtures = {
  loginPage: LoginPage;
  orderBoard: OrderBoardPage;
  orderForm: OrderFormPage;
  orderHistory: OrderHistoryPage;
};

export const test = baseTest.extend<HaruFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  orderBoard: async ({ page }, use) => {
    await use(new OrderBoardPage(page));
  },
  orderForm: async ({ page }, use) => {
    await use(new OrderFormPage(page));
  },
  orderHistory: async ({ page }, use) => {
    await use(new OrderHistoryPage(page));
  },
});

export { expect };
