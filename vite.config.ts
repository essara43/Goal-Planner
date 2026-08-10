import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Chemin de base du site.
 *
 * Vaut `/` en local, et `/Goal-Planner/` sur GitHub Pages, où le site est servi
 * dans un sous-dossier portant le nom du dépôt. Sans cela, les assets sont
 * cherchés à la racine du domaine et la page reste blanche.
 */
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Le service worker se met à jour tout seul au prochain lancement :
      // l'app étant installée en local, personne n'ira forcer un rechargement.
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Goal Planner',
        short_name: 'Goals',
        description: "Suivi local d'objectifs par domaine de vie.",
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Tout l'app shell est précaché : aucune requête réseau au lancement.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
