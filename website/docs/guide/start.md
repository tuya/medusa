---
toc: menu
order: 2
---

# 快速上手

## 主应用

### 1. 安装 美杜莎

```bash
$ yarn add medusa.js
```
### 2. 主应用接入

```js
import {Router, Route} from 'medusa.js'

function Container() {
  return <Router loading={<div>loading...</div>}>
    <Route html="http://localhost:7100" appId="myChild" path="/child" />
  </Router>
}

```

主应用必须使用react框架，美杜莎使用react的生命周期作为路由组件的生命周期

## 子应用
在美杜莎的运行环境下，子应用基本不需要改动代码就能直接运行。

