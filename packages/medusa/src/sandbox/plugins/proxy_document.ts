import Log from '../../utils/log';
import {resetUrl} from '../../html-parse/utils';
import {parseScriptSrc} from '../../utils/url';
import {isWindowFunction} from '../../utils/proxys/fn';

/**
 * 如果这里是相对地址，就会有问题，所以要求子项目设置真实的地址。
 */
const fetchScript = async (url: string, sandbox?: Window) => {
  const resp = await fetch(url);
  if (resp.status === 200) {
    const proxyWin = sandbox || window;
    const scriptStr = await resp.text();
    const execScript = `with (window) {;${scriptStr}\n//# sourceURL=${url}\n}`;
    const code = new Function('window', execScript).bind(proxyWin);
    code(proxyWin);
  } else {
    const error: any = new Error('Error when loading route: '.concat(url));
    error.code = 'PAGE_LOAD_ERROR';
    throw (error);
  }
};

export const headProxy = (
    op: {
      head: HTMLHeadElement,
      sandbox?: Window,
      injection?: (target: HTMLHeadElement, p: PropertyKey) => any,
      excludeAssetFilter?: (assetUrl: string) => boolean
      assetPublicPath?: string
    }
) => {
  return new Proxy(op.head, {
    get(target, p) {
      if (p === 'appendChild') {
        const appendChild = target[p];
        return function(...args) {
          const ele = args[0] as HTMLScriptElement;
          if (ele && ele.nodeName === 'SCRIPT' && ele.src) {
            if (op.excludeAssetFilter?.(ele.src)) {
              Log.info('当前script标签加载被沙箱放行！！', ele);
              return appendChild.apply(op.head, args as any);
            }
            Log.info('当前script标签加载被沙箱捕获！！', ele);
            let src = ele.src ? parseScriptSrc(ele.outerHTML) : '';
            if (src && op.assetPublicPath) {
              src = resetUrl(src, op.assetPublicPath);
            }
            fetchScript(src || ele.src, op.sandbox);
            return document.createElement('script');
          }
          return appendChild.apply(op.head, args as any);
        };
      }

      const injectValue = op.injection?.(target, p);
      if (injectValue) {
        return injectValue;
      }

      const value = target[p];
      if (isWindowFunction(value)) {
        return value.bind(op.head);
      }
      return value;
    },
    set(target, p, v) {
      target[p] = v;
      return true;
    }
  });
};

export const proxyDocument = (
    doc: HTMLDocument,
    sandbox?: Window,
    excludeAssetFilter?: (assetUrl: string) => boolean
) => {
  return new Proxy(doc, {
    get(target, p) {
      const value = target[p];
      if (['body', 'head'].includes(p as string)) {
        return headProxy({
          head: value,
          sandbox,
          excludeAssetFilter
        });
      }
      if (isWindowFunction(value)) {
        return value.bind(doc);
      }
      return value;
    },
    set(target, p, v) {
      target[p] = v;
      return true;
    }
  });
};
