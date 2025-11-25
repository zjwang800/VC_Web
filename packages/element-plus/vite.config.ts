import path from 'path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { alias } from '../../scripts'

export default defineConfig(async ({ command, mode }) => {
  let docsBuild = {}
  if (mode === 'docs') {
    docsBuild.base = './'
    docsBuild.build = {
      outDir: '../../docs/.vitepress/dist/element-plus'
    }
  }

  return {
    server: {
      port: 3333
    },
    plugins: [vue()],
    build: {
      minify: false, // 禁用混淆，保持变量名
      lib: {
        entry: path.resolve(__dirname, './components/index.ts'),
        name: 'voiceUi',
        fileName: 'vc-element-plus',
        formats: ['es', 'cjs']
      },
      rollupOptions: {
        external: ['element-plus', 'vue'],
        output: {
          preserveModules: true,
          preserveModulesRoot: 'components', // 按你的目录结构调整
          exports: 'named'
        }
      }
    },
    resolve: {
      alias: await alias()
    },
    ...docsBuild
  }
})
