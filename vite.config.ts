import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import tailwindcss from '@tailwindcss/vite'
import compressionPlugin from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(__dirname, 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]'
      }),
      compressionPlugin({
        ext: '.gz', // 指定压缩后的文件扩展名
				algorithm: 'gzip', // 指定压缩算法 (gzip, brotli, deflate)
				threshold: 1024, // 指定文件大小的最小值，小于该值的文件不会被压缩 (单位：字节)
				deleteOriginFile: false, // 是否删除原始文件，默认为 false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 9090),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8686',
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
})
