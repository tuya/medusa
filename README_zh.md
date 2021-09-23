# medusa(美杜莎)

> (M)ircrofront(E)n(D) (U)niversal(S)inglepage(A)pplication. [中文文档](https://tuya.github.io/medusa/)

[English](https://github.com/tuya/medusa)｜简体中文｜

medusa是一款基于各种框架之上的微前端框架，具有极高的框架兼容性，能够运行在目前主流的几种微前端框架之上。使得[乾坤](https://github.com/umijs/qiankun)、[飞冰](https://github.com/ice-lab/icestark)、[京东微前端](https://github.com/micro-zoe/micro-app)以及[next.js](https://github.com/vercel/next.js)能够同时运行在一个环境下。并全部采用`proxy`的沙箱方案，摒弃老旧浏览器的兼容性问题，完全隔离主应用与微应用。

# 特性

1. 不限制使用的前端框架

2. 兼容qiankun,飞冰,京东等微前端框架，可以直接加载，不需要任何改动

3. 支持服务端渲染模式的直接使用

4. 支持加载比较流行的服务端渲染框架next.js

5. 支持作为独立微前端框架来使用

6. 以React组件的生命周期作为微应用的生命周期


# 开始使用

更多用法请查看[Examples](./examples)

## 主应用

> 主应用限定为React

1. 安装依赖

```shell
$ yarn add mmed 
```

2. 主应用引入路由

```tsx

import {Router, Route} from 'mmed'

const App = () => {
  return <Router loading={<div>loading...</div>}>
    <Route html="http://localhost:7100" appId="reactApp" />
  </Router>
}

ReactDOM.render(<App />, document.getElementById('app'))

```

## 微应用

> 以开发模式为例

1. 设置页面跨域

```js
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}

```

# 示例

在examples目录，包含了一个主应用和三个子应用的示例。并展示了在一个主应用里面如何采用8种方式加载微前端。


```shell
git clone https://github.com/medusa.git
cd medusa
```

```shell

yarn demo

```

![](./examples/demo.gif)

# License
[MIT](./LICENSE)
