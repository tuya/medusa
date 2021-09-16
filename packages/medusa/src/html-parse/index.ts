import {FetchFn, getPublicPath} from './utils';
// import ServerParser from './server';
import BrowerParser from './browser';

const cachedHtmlMap: Record<string, string> = {};


export const importHtml = async (url: string, fetchFn?: FetchFn) => {
  if (!fetchFn && typeof fetch !== 'undefined') {
    fetchFn = fetch;
  }

  if (!fetchFn) {
    throw new Error('cannot excute fetch function!');
  }

  let htmlStr = cachedHtmlMap[url];

  if (!htmlStr) {
    const resp = await fetchFn(url);
    htmlStr = cachedHtmlMap[url] = await resp.text();
  }

  const assetPublicPath = getPublicPath(url);

  // if (typeof DOMParser === 'undefined') {
  //   const parser = new ServerParser(htmlStr, assetPublicPath);
  //   return parser.extract(fetchFn);
  // } else {
  const parser = new BrowerParser(htmlStr, assetPublicPath);
  return parser.extract(fetchFn);
  // }
};

