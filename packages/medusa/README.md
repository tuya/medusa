# medusa

> [medusa docs](https://github.com/tuya/medusa)

## Installation

```shell
yarn add mmed
```

## To Use

```tsx

import {Router, Route} from 'mmed'

const App = () => {
  return <Router loading={<div>loading...</div>}>
    <Route html="http://localhost:7100" appId="reactApp" />
  </Router>
}

ReactDOM.render(<App />, document.getElementById('app'))

```

## License

[MIT](https://github.com/tuya/medusa/blob/master/LICENSE)