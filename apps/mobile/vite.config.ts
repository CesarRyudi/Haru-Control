import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/mobile",

  plugins: [react()],

  server: {
    port: 4200,
    host: "0.0.0.0",
    fs: {
      allow: ["../../"],
    },
  },

  preview: {
    port: 4300,
    host: "localhost",
  },

  build: {
    outDir: "../../dist/apps/mobile",
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@haru-control/types": resolve(
        __dirname,
        "../../libs/types/src/index.ts"
      ),
      "@haru-control/ui": resolve(__dirname, "../../libs/ui/src/index.ts"),
      "@haru-control/utils": resolve(
        __dirname,
        "../../libs/utils/src/index.ts"
      ),
    },
  },

  optimizeDeps: {
    exclude: ["@prisma/client", ".prisma/client"],
  },
});
