---
toc: menu
order: 3
---

# 项目实践

## CDN-JS

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" assets={{js: ['http://cdn.xxx.xx.js']}} appId="myChild" path="/child" />
  </Router>
}

```

## 普通webpack

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" html="http://xxx.xx.com/index.html" appId="myChild" path="/child" />
  </Router>
}

```

#### 子应用

如果是开发模式下，请配置webpack devServer的跨越

```js

{
  devServer: {
    'Access-Control-Allow-Origin': '*',
  }
}

```


## next.js

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" html="http://xxx.xxx.com" framework="next" autoUnmount />
  </Router>
}

```

#### 子应用

配置子应用的静态资源访问地址

修改`next.config.js`

```js
module.exports = {
  assetPrefix: 'http://localhost:xxx/',
}


```

## qiankun

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" html="http://xxx.xxx.com" framework="qiankun" />
  </Router>
}


```

#### 子应用

`参考乾坤子项目的配置，不需要任何改动`


## icestark

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" assets={{
      js: ['https://xxx.xx.com/js/index.js'],
      css: ['https://xxx.xx.com/index.css']
    }}" framework="icestark" />
  </Router>
}


```

#### 子应用

`参考飞冰子项目的配置，不需要任何改动`


## 京东微前端

#### 主应用

```js

import {Router, Route} from 'mmed'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route path="/child" html="https://xxx.com/index.html" appId="child" basename="/child" framework="zoe" />
  </Router>
}


```

#### 子应用

`参考京东微前端子项目的配置，不需要任何改动`