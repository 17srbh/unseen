import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configures Vite to compile the React application during development and builds.
export default defineConfig({
  plugins: [react()],
});
