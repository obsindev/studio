import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, Plugin } from "vite";
import fs from "fs/promises";

const CONFIG_FILE = path.resolve(import.meta.dirname, "config.json");

// API Plugin - API route'larını handle eder
function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Middleware'i en başa ekle (Vite'ın internal middleware'lerinden önce)
      server.middlewares.use(async (req, res, next) => {
        // API route'larını kontrol et
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // GET /api/config
        if (req.url === '/api/config' && req.method === 'GET') {
          try {
            const data = await fs.readFile(CONFIG_FILE, "utf-8");
            const config = JSON.parse(data);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(config));
          } catch (error: any) {
            if (error.code === "ENOENT") {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end('null');
            } else {
              console.error("Config okuma hatası:", error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Config okunamadı" }));
            }
          }
          return;
        }

        // POST /api/config
        if (req.url === '/api/config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const config = JSON.parse(body);
              await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: "Config kaydedildi" }));
              console.log('✅ Config kaydedildi:', CONFIG_FILE);
            } catch (error) {
              console.error("Config kaydetme hatası:", error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Config kaydedilemedi" }));
            }
          });
          return;
        }

        // Bilinmeyen API route
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'API endpoint bulunamadı' }));
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    apiPlugin(), // API plugin'i en başta
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: import.meta.dirname,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
});
