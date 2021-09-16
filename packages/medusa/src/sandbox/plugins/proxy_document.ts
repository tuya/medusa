import Log from '../../utils/log';
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

export const headProxy = (head: HTMLHeadElement, sandbox?: Window, injection?: (target: HTMLHeadElement, p: PropertyKey) => any) => {
  return new Proxy(head, {
    get(target, p) {
      if (p === 'appendChild') {
        const appendChild = target[p];
        return function(...args) {
          const ele = args[0] as HTMLScriptElement;
          if (ele && ele.nodeName === 'SCRIPT' && ele.src) {
            Log.info('当前script标签加载被沙箱捕获！！', ele);
            fetchScript(ele.src, sandbox);
            return document.createElement('script');
          }
          return appendChild.apply(head, args as any);
        };
      }

      const injectValue = injection?.(target, p);
      if (injectValue) {
        return injectValue;
      }

      const value = target[p];
      if (isWindowFunction(value)) {
        return value.bind(head);
      }
      return value;
    }
  });
};

export const proxyDocument = (doc: HTMLDocument, sandbox?: Window) => {
  return new Proxy(doc, {
    get(target, p) {
      const value = target[p];
      if (['body', 'head'].includes(p as string)) {
        return headProxy(value, sandbox);
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
