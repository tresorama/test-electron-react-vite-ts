import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //
  // Inside the output "index.html" load assets file with a path 
  // relative to the index.html and not the active web server that is loading the web page.
  // So instead of <link src="/assets/file.css" />
  // print as <link src="./assets/file.css" />
  // This is required because "Electron" will be the webserver,
  //  so a path relative to the webserver will point to electron root and not vite output dir.
  base: './',
  //
  // Say to Vite to output the output bundled files in a specified directory
  build: {
    outDir: path.resolve(__dirname, '../electron/renderer/dist'),
    //
    // before writing to disk empty the destination folder (clean previous build)
    emptyOutDir: true,
  },
});
