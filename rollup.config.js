import { nodeResolve } from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import CommonJS from '@rollup/plugin-commonjs'
import VuePlugin from 'rollup-plugin-vue'
import PostCSS from 'rollup-plugin-postcss'
import { terser } from "rollup-plugin-terser"
import pkg from './package.json'

export default {
  input: 'src/VueTimepicker.vue',
  output: [ 
    {
      file: pkg.module,
      format: 'esm',
      name: 'VueTimepicker',
      sourcemap: true
    },
    {
      file: pkg.main,
      format: 'cjs',
      name: 'VueTimepicker',
      sourcemap: true
    },
    {
      file: pkg.unpkg,
      format: 'umd',
      name: 'VueTimepicker',
      sourcemap: true,
      globals: {
        vue: 'Vue'
      },
      plugins: [terser()]
    }
  ],
  plugins: [
    VuePlugin({
      css: false
    }),
    babel({ babelHelpers: 'bundled' }),
    nodeResolve(),
    CommonJS(),
    PostCSS({
      extract: 'VueTimepicker.css',
      minimize: true
    })
  ],
  // ask rollup to not bundle Vue in the library
  external: ['vue']
}
