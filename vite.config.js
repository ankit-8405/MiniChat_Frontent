import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if SSL certificates exist
const sslKeyPath = path.resolve(__dirname, '../server/ssl/key.pem');
const sslCertPath = path.resolve(__dirname, '../server/ssl/cert.pem');

const httpsConfig = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)
  ? {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    }
  : false;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    https: false // Disable HTTPS for client to avoid certificate issues
  }
});
