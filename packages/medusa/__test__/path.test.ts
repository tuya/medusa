import Layer from '../src/utils/path';

test('path match 1', () => {
  const layer = new Layer('/child1(.*)');
  layer.match('/child1');

  expect(layer.isMatched).toBe(true);

  expect(layer.result?.path).toBe('/child1');
  expect(layer?.result?.params).toEqual({0: ''});
  expect(layer.formatUrl('/abc/{0}')).toEqual('/abc/');

  layer.match('/child1/');
  expect(layer.isMatched).toBe(true);

  expect(layer.result?.path).toBe('/child1/');
  expect(layer.result?.params).toEqual({0: '/'});

  layer.match('/child1/a');
  expect(layer.isMatched).toBe(true);

  expect(layer.result?.path).toBe('/child1/a');
  expect(layer.result?.params).toEqual({0: '/a'});

  layer.match('/child2/a');
  expect(layer.isMatched).toBe(false);
});

test('path match 2', () => {
  const layer = new Layer('/child1');
  layer.match('/child1');

  expect(layer.isMatched).toBe(true);

  expect(layer.result?.path).toBe('/child1');
  expect(layer?.result?.params).toEqual({});

  layer.match('/child1/');
  expect(layer.isMatched).toBe(true);

  expect(layer.result?.path).toBe('/child1/');
  expect(layer.result?.params).toEqual({});

  layer.match('/child1/a');
  expect(layer.isMatched).toBe(false);
});

test('path match 3', () => {
  const layer = new Layer('/child1/:id');
  layer.match('/child1/2');
  expect(layer.isMatched).toBe(true);
  expect(layer.formatUrl('/abc/{id}')).toEqual('/abc/2');
});

test('path match 4', () => {
  const layer = new Layer('/child1/:id*');
  layer.match('/child1');
  expect(layer.formatUrl('/abc{id}')).toEqual('/abc');
  layer.match('/child1/2');
  expect(layer.formatUrl('/abc{id}')).toEqual('/abc2');
  layer.match('/child1/2/3');
  expect(layer.formatUrl('/abc{id}')).toEqual('/abc2/3');
});

test('path match 5', () => {
  const layer = new Layer('/project/:projectId/(.*)');
  layer.match('/project/12323/projectInfo');
  expect(layer.formatUrl('/abc{projectId}/{0}')).toEqual('/abc12323/projectInfo');
});
