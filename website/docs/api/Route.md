---
toc: menu
order: 2
---


# Route

React组件，用于定义微应用的加载规则

### path?: string

一般是必传的，用于匹配当前url路径，支持正则匹配，使用的是path-to-regexp这个库（和express路由规则类似）。

### exact?: boolean

是否需要完全匹配，也就是路径完全一致

### html?: string

微应用的页面地址，比如 http://localhost:3000/ , 支持正则表达式： 

比如path传`/page1/:pageType`， html传`http://localhost:3000/{pageType}`。  
最终如果浏览器地址为 http://localhost:8080/page1/myPage, 这时候真实获取的地址就会变成 http://localhost:3000/myPage


这种方式比较推荐，因为很多时候我们的js和css等文件名在编译之后会变化的，使用类似`webpack-html-plugin`等插件生成的html会将js等资源自己插入到页面中。

### basename?: string

透传给微应用的路由前缀，同样也支持正则表达式, 规则于html参数一致

比如path传`/page1/:pageType`  
basename传 `/{pageType}`
浏览器路径为 http://localhost:8080/page1/myPage 
basename最终传给微应用的就为 `/myPage`

tips: 微应用里面可以使用getBasename获取这个值。这个值实际上是挂载了微应用的沙箱上的。通过window也能获取到。。。

### appId?: string

用于区分每个微应用的id号，因为很多微应用框架都需要这个参数,所以这里我们也推荐写上

如果微应用使用了hackWebpack。请保证此appId和hackWebpack传入的一致

### autoUnmount?: boolean

是否启用自动卸载功能，因为微应用在移除的时候，实际上是删除当前微应用挂载的dom节点，如果微应用是react，dom节点被删除并不能保证react生命周期被卸载。  因此一般情况下，微应用需要自己调用一下React.uncomponentAtNode。
如果启用该功能，微应用就不用调用了，这里我们会使用react未暴露的方法root._reactRootContainer.unmount()来执行根节点的卸载

### credentials?: boolean

是否携带cookie访问资源

某些情况下访问html比如next，会需要携带cookie到服务端做进一步的登录校验。

### assets?: {js: [], css: []}

非html方式加载微应用，通过手动指定微应用的js和css。这种方式飞冰也在用，有优点也有缺点，优点是很多时候只需要一个js。不需要部署微应用

### manifest?: url

使用清单方式加载微应用，不常用，一般为一个json文件的地址由webpack生成

### peer?: boolean

设置此字段时，此路由将会作为正经路由使用，匹配成功直接显示子组件

比如：

```js
<Router >
  <Route path="/child1">
    <h1>这是一个正常的react组件</h1>
  </Route>
</Router>

```

### globalVars?: []

传如此参数，如果为应用中在window上访问或设置数组中的变量，将不会挂载到沙箱上。某些情况可能需要这个功能