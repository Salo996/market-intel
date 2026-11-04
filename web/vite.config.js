import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
const nm = (p) => path.resolve("./node_modules", p);
export default defineConfig({
  plugins: [react()],
  base: "./",
  // the Power BI visual's component is imported from the sibling project; force one copy of React
  resolve: { alias: { react: nm("react"), "react-dom": nm("react-dom") } },
  server: { fs: { allow: [".."] } },
});
