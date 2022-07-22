import {AssetItem} from '../../html-parse/utils';
import {parseAssets} from '../../utils/assets';
import Log from '../../utils/log';
import {_scriptCache} from './assets';

type FetchItem = {
  assets?: {
    js?: Array<string>
    css?: Array<string>
  },
  manifest?: string
  html?:string
  next?: string
  credentials?: boolean
  query?:string
  onUrlFix?: (url: string) => string | undefined
  prefetchUrl?: string
}


const fetchJsList = async (jsList?: string[]) => {
  if (!jsList?.length) {
    return;
  }
  await Promise.all(jsList.map(async (url)=>{
    if (_scriptCache[url]) {
      return _scriptCache[url];
    }
    const resp = await fetch(url);
    const str = await resp.text();
    _scriptCache[url] = str;
    return str;
  }));
};


const prefetchItem = (item: FetchItem) => {
  return new Promise((resolve) => {
    (window as any).requestIdleCallback(async () => {
      try {
        /**
         * html和next模式下的时候，脚本会自动加载，不需要再主动fetch
         */
        const {jsList} = await parseAssets(item);

        (window as any).requestIdleCallback(async () => {
          try {
            await fetchJsList(jsList);
          } finally {
            resolve(true);
          }
        });
      } catch (error) {
        console.error(error);
        resolve(true);
      }
    });
  });
};

export const prefetch = async (list: FetchItem[]) => {
  for (const item of list) {
    const op = {...item};
    const url = op.prefetchUrl || op.html || op.next;
    if (url?.includes('{')) {
      Log.warn('prefetch', 'We can not currently guess this url');
      continue;
    }
    if (op.prefetchUrl) {
      op.html = op.prefetchUrl;
    }
    await prefetchItem(op);
  }
};

