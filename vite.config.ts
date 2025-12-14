import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // APK va WebView uchun nisbiy yo'llar
  server: {
    host: true, // Tarmoq orqali ulanish uchun
  }
});