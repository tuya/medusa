---
toc: menu
order: 3
---

# 常用方法

### appHistory

实际上就是window.history

```js

appHistory.push = (path: string) =>  window.history.pushState({}, '', path);

appHistory.replace = (path: string) => window.history.replaceState({}, '', path);

```

### <AppLink />

AppLink是一个React组件，使用方式为：

```js
  <AppLink to="/child1">点击跳转</AppLink>
```

等价于

```js
  <a href="/child1" onClick={(e) => {
    e.preventDefault()
    appHistory.push('/child1')
  }}>点击跳转</a>
```

### isInMicroApp()

判断当前项目是否在微前端框架内，因为有些时候子项目也需要独立运行与访问


### getBasename()

1. 获取当前微应用的basename，如果微应用内部用了自己的路由，比如react-router。就可能需要这个方法。
2. 如果当前微应用是独立运行的，getBasename()获取的值是`/`

### getMountedNode()

获取当前微应用需要挂载的DOM节点。一般和isInMicroApp配合使用,比如:

```js
  if (isInMicroApp()) {
    ReactDOM.render(<App />, getMountedNode())
  } else {
    ReactDOM.render(<App />, document.getElementById('app'))
  }
```