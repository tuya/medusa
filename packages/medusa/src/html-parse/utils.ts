export type FetchFn = (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>

export type AssetItem = {
  src?: string
  async?: boolean
  content?: string
  id?: string
  fetching?: Promise<any>
  hasRisk?: boolean
}


export const COMMENT_REGEX = /<!--.*?-->/g;

export function getPublicPath(entry: string) {
  try {
    // URL 构造函数不支持使用 // 前缀的 url
    const {origin, pathname} = new URL(entry.startsWith('//') ? `${location.protocol}${entry}` : entry, location.href);
    const paths = pathname.split('/');
    // 移除最后一个元素
    paths.pop();
    return `${origin}${paths.join('/')}/`;
  } catch (e) {
    console.warn(e);
    return '';
  }
}

export const getCleanHtml = (html: string) => {
  const domContent = (new DOMParser()).parseFromString(html.replace(COMMENT_REGEX, ''), 'text/html');

  const scripts = Array.from(domContent.getElementsByTagName('script'));
  const inlineStyleSheets = Array.from(domContent.getElementsByTagName('style'));
  const externalStyleSheets = Array.from(domContent.getElementsByTagName('link')).filter((link) => !link.rel || link.rel.includes('stylesheet'));

  scripts.forEach((ele) => {
    ele.remove();
  });

  inlineStyleSheets.forEach((ele) => {
    ele.remove();
  });

  externalStyleSheets.forEach((ele) => {
    ele.remove();
  });

  return domContent;
};

export const fetchContents = (src: string, caches: Array<Promise<string>>, fetchFn?: FetchFn) => {
  if (caches[src]) {
    return caches[src];
  }
  return new Promise((resolve, reject) => {
    if (typeof fetchFn === 'undefined') {
      return resolve('');
    }
    const fetching = fetchFn(src)
        .then((resp)=>resp.text())
        .then((text) => {
          resolve(text);
          return text;
        })
        .catch((err) => {
          caches[src] = undefined;
          reject(err);
        });
    caches[src] = fetching;
  });
};

function hasProtocol(url: string) {
  return url.startsWith('//') || url.startsWith('http://') || url.startsWith('https://');
};

export const resetUrl = (url: string, assetPublicPath?: string) => {
  if (hasProtocol(url) || !assetPublicPath) {
    return url;
  }
  return new URL(url, assetPublicPath).toString();
};

export const getStyleContents = (list: AssetItem[]) => {
  return Promise.all(list.map((item) => {
    return new Promise<string>((resolve, reject) => {
      if (item.fetching) {
        item.fetching.then(resolve).catch(reject);
        return;
      }
      resolve(item.content || '');
    });
  }));
};


export const resetScope = (prefix: string, styleStr: string) => {
  const parser = new DOMParser();

  const body = parser.parseFromString(`<style>${styleStr}</style>`, 'text/html');

  const style = body.querySelector('style');

  if (!style?.sheet) {
    return styleStr;
  }

  let str = '';
  for (let i = 0; i< (style.sheet.cssRules.length || 0); i ++) {
    const rule = style.sheet.cssRules[i];
    if (rule.cssText.startsWith('@')) {
      str += `${rule.cssText}` + '\n';
    } else {
      const selectorText = (rule as any).selectorText as string;
      if (selectorText && rule.cssText.startsWith(selectorText) && selectorText.includes(',')) {
        const bodyStr = rule.cssText.replace(selectorText, '');
        const prefixStr = selectorText.split(',').map((t) => `${prefix} ${t}`).join(',');
        str += `${prefixStr} ${bodyStr}` + '\n';
      } else {
        str += `${prefix} ${rule.cssText}` + '\n';
      }
    }
  }

  return str;
};

