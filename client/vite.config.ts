import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3100,
    proxy: {
      "/api/copilotkit": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
