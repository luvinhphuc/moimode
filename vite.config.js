import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			three: fileURLToPath(new URL("./node_modules/three", import.meta.url)),
		},
		dedupe: ["react", "react-dom", "three"],
	},
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"three",
			"@react-three/fiber",
			"@react-three/drei",
		],
	},
});
