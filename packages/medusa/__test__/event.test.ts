import {subscribe, dispatch} from '../client';

test('subscribe', () => {
  subscribe((v) => {
    console.log(v);
  });

  const v = Object.assign({}, null, {a: 1});

  dispatch({aa: 1});

  console.log(v);
});
