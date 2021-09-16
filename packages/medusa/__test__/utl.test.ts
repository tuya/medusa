import {isPrefixUrl, parseBaseName, urlJoin} from '../src/utils/url';


test('isPrefixUrl', () => {
  expect(isPrefixUrl('/timeline/', '/timeline')).toBe(true);
  expect(isPrefixUrl('/timeline', '/timeline')).toBe(true);
  expect(isPrefixUrl('/timeline', '/timeline/')).toBe(true);
  expect(isPrefixUrl('/timelina', '/timeline/')).toBe(false);
});

test('parseBaseName', () => {
  expect(parseBaseName('/a/b')).toEqual('/a');
  expect(parseBaseName('/a/b/')).toEqual('/a/b');
  expect(parseBaseName('/a')).toEqual('/');
  expect(parseBaseName('/a(.*)')).toEqual('/');
  expect(parseBaseName('/a(.*)', '/a{0}', {0: 3})).toEqual('/a3');

  expect(parseBaseName('/a/b', '/a')).toEqual('/a');
  expect(parseBaseName('/a/b/', '/a')).toEqual('/a');

  expect(parseBaseName('/a/b/', '/a{1}', {1: 3})).toEqual('/a3');
});


test('urlJoin', () => {
  expect(urlJoin(['', '/'])).toEqual('/');
  expect(urlJoin(['', ''])).toEqual('/');
  expect(urlJoin(['', ''], true)).toEqual('/');
  expect(urlJoin(['', '/', ''], true)).toEqual('/');
  expect(urlJoin(['', '/', '', '/'], true)).toEqual('/');


  expect(urlJoin(['/', '/'])).toEqual('/');
  expect(urlJoin(['/', '//'])).toEqual('/');


  expect(urlJoin(['/', '/b/'])).toEqual('/b');
  expect(urlJoin(['/', '/b'])).toEqual('/b');


  expect(urlJoin(['/a', '/b'])).toEqual('/a/b');
  expect(urlJoin(['/a/', '/b/'])).toEqual('/a/b');

  expect(urlJoin(['//a//', '/b//'])).toEqual('/a/b');
});
