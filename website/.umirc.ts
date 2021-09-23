import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'medusa',
  favicon: 'https://images.tuyacn.com/rms-static/ef5d51b0-03bf-11ec-8caa-bf190bbd93b6-1629688343115.jpg',
  logo: 'https://images.tuyacn.com/rms-static/ef5d51b0-03bf-11ec-8caa-bf190bbd93b6-1629688343115.jpg',
  outputPath: '../docs',
  mode: 'site',
  resolve: {
    includes: ['docs'],
  },
  navs: [
    null,
    { title: 'GitHub', path: 'https://github.com/tuya/medusa' },
  ],
  history: {
    type: 'hash'
  },
  // more config: https://d.umijs.org/config
});
