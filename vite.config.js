import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import postcss from 'postcss-preset-env';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    postcss({})
  ],
})
