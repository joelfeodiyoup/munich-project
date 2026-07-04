import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { copyFileSync } from "fs";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    {
      name: "copy-sql-wasm",
      buildStart() {
        copyFileSync(
          "node_modules/sql.js/dist/sql-wasm.wasm",
          "public/sql-wasm.wasm",
        );
      },
    },
  ],
});

export default config;
