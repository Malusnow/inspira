import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type PluginOption} from "vite"
import { visualizer } from "rollup-plugin-visualizer";

const base = process.env.VITE_BASE_PATH ?? "/"

export default defineConfig({
  base,
  plugins: [
    react(), 
    tailwindcss(), 
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
  ]
})
