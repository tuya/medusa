---
hero:
  title: Medusa
  desc: 一体化的微前端解决方案（微前端的微前端框架！）🤓
  actions:
    - text: 快速开始
      link: /guide
features:
  - title: 包容性
    desc: 支持目前主流的微前端框架（飞冰、乾坤、京东），并能支持支持服务端渲染框架（next.js）
  - title: 零侵入性
    desc: 子项目几乎不需要任何改动就能直接运行
  - title: 完全沙箱环境
    desc: 子应用运行环境均运行在特定的沙箱中，支持多级嵌套。
footer: Open-source MIT Licensed | Copyright © 2021<br />Powered by [Tuya.inc](https://d.umijs.org)
---

## 快速接入!

```shell
  $ yarn add mmed
```

```js
import {Router, Route} from 'mmed'

const App = () => {
  return <Router loading={<div>loading...</div>}>
    <Route html="http://localhost:7100" appId="reactApp" />
  </Router>
}
```