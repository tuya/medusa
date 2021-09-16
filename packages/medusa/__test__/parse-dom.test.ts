import htmlStr from './html';
import ServerParse from '../src/html-parse/server';
import BrowerParser from '../src/html-parse/browser';


test('parse html', () => {
  const parser = new ServerParse(htmlStr);
  const obj1 = parser.extract();

  const parser2 = new BrowerParser(htmlStr);
  const obj2 = parser2.extract();

  expect(obj1.entry).toEqual(obj2.entry);

  expect(obj1.scripts.length).toEqual(obj2.scripts.length);

  expect(obj1.styles.length).toEqual(obj2.styles.length);

  expect(obj1.scriptJson).toEqual(obj2.scriptJson);

  console.log(obj1, obj2);
});

