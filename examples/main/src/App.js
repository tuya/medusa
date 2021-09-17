import logo from './logo.svg';
import './App.css';
import {Router, Route, appHistory} from 'mmed'

function App() {
  console.log('redner....')
  return (
    <div className="App">
      <aside>
        <ul>
          <li onClick={() => {
            appHistory.push('/child1')
          }}>普通create-react-app应用</li>
          <li  onClick={() => {
            appHistory.push('/child2')
          }}>乾坤子项目</li>
          <li  onClick={() => {
            appHistory.push('/child3')
          }}>next子项目</li>
          <li onClick={() => {
            appHistory.push('/child4')
          }}>官方icestark子应用</li>
        </ul>
      </aside>
      <section>
        <Router>
          <Route framework="zoe" />
          <Route html="http://localhost:8001{0}" path="/child1(.*)" rootId="root" autoUnmount />
          <Route html="http://localhost:8002{0}" path="/child2(.*)" framework="qiankun" />
          <Route next="http://localhost:8003{0}" path="/child3(.*)" framework="next" autoUnmount />
          <Route assets={{
            js: ['https://iceworks.oss-cn-hangzhou.aliyuncs.com/icestark/child-seller-react/build/js/index.js'],
            css: ['https://iceworks.oss-cn-hangzhou.aliyuncs.com/icestark/child-seller-react/build/css/index.css']
          }} path="/child4(.*)" framework="icestark" autoUnmount basename="/child4" />
          <Route assets={{
            js: ['https://iceworks.oss-cn-hangzhou.aliyuncs.com/icestark/child-waiter-vue/dist/js/app.js'],
            css: ['https://iceworks.oss-cn-hangzhou.aliyuncs.com/icestark/child-waiter-vue/dist/css/app.css']
          }} path="/waiter(.*)" framework="icestark" basename="/waiter" />
          <Route path="/micro-app(.*)" html="https://zeroing.jd.com/micro-app/react16" appId="react16" basename="/micro-app/demo/react16" framework="zoe" />
          <Route path="/*" peer>
            这里是单纯的react组件，没匹配到会来这里
          </Route>
        </Router>

      </section>
    </div>
  );
}

export default App;
