---
nav:
  title: API
  order: 1
toc: menu
order: 1
---

# Router

React组件，定位微应用的渲染位置，微应用加载完成之后，展示的位置就是在Router的位置。 

### appId?: string

整个美杜莎实例的appId, 在一个页面存在多个Router的时候需要用到，一般不用传

### urlMapPrefix?: string

默认值是：_tyPathMap

进行微前端开发的时候，如果需要本地页面调试远程页面的时候，可以在url后面加上?_tyPathMap=http://localhost:3000/sourceMap.json 来将美杜莎的路由匹配规则替换，这样可以重新设置微应用地址微本地地址。

### LoadingComponent?: React.ReactNode

默认值是: loading...

此参数用于在加载微应用过程中显示自定义的loading界面
