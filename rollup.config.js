import pkg from './package.json';
import buble from '@rollup/plugin-buble';
export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      name: 'GraphEditor',
      format: 'cjs'
    },
    {
      file: pkg.iife,
      name: 'GraphEditor',
      format: 'iife',
      globals: {
        d3: 'd3'
      }
    },
    {
      file: pkg.module,
      name: 'GraphEditor',
      format: 'esm'
    }
  ],
  external: [...Object.keys(pkg.dependecies || {}), ...Object.keys(pkg.peerDependencies || {})], // 指定为外部模块, 不打包到模块中
  plugins: [buble()]
};
