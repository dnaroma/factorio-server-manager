import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    root: "ui",
    plugins: [react()],
    base: "./",
    publicDir: false,
    server: {
        proxy: {
            "/api": "http://localhost:80",
            "/ws": {
                target: "ws://localhost:80",
                ws: true,
            },
        },
    },
    build: {
        outDir: "../app",
        emptyOutDir: false,
        rollupOptions: {
            output: {
                entryFileNames: "bundle.js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: assetInfo => {
                    if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                        return "style.css";
                    }
                    return "assets/[name][extname]";
                },
            },
        },
    },
});
