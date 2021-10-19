import Sandbox from '../src/sandbox';

test('porxy test', () => {
  const sandbox = new Sandbox();
  sandbox.init();
  const proxy = sandbox.getSandbox();

  expect('Promise' in proxy!).toBe(true);
});
