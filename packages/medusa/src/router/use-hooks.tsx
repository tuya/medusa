import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {HIJACK_EVENTS_NAME, topWindow} from '../common';
import {parseUrl} from '../utils/url';
import Route, {IRouteProps} from '../route';
import Layer from '../utils/path';
import router from '../packages/router-system';
import browserRouter from '../packages/browser-history';

import {appHistory} from '../link';
import Sandbox from '../sandbox';
import usePersistFn from '../hooks/use-persist-fn';
import {prefetch} from '../plugins/common/prefetch';
import Log from '../utils/log';

/**
 * 为了兼容qiankun
 */
function createPopStateEvent(state) {
  // https://github.com/single-spa/single-spa/issues/224 and https://github.com/single-spa/single-spa-angular/issues/49
  // We need a popstate event even though the browser doesn't do one by default when you call replaceState, so that
  // all the applications can reroute. We explicitly identify this extraneous event by setting singleSpa=true and
  // singleSpaTrigger=<pushState|replaceState> on the event instance.
  let evt;
  try {
    evt = new PopStateEvent('popstate', {state});
  } catch (err) {
    // IE 11 compatibility https://github.com/single-spa/single-spa/issues/299
    // https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-html5e/bd560f47-b349-4d2c-baa8-f1560fb489dd
    evt = document.createEvent('PopStateEvent');
    evt.initPopStateEvent('popstate', false, false, state);
  }
  evt.medusa = true;
  return evt;
}

export const useHistoryEvents = ({autoPopState}: {autoPopState?: boolean}) => {
  const [urlOption, setUrlOption] = useState<{
    pathname: string
    query?: string
    hash: string
  } | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return parseUrl(location.href);
  });

  const refEventsPool = useRef<{[key:string]:Array<any>}>({
    hashchange: [],
    popstate: [],
  });

  const onStateChange = usePersistFn((evt: PopStateEvent, url?: string|null, routeType?: 'pushState' | 'replaceState')=>{
    if (!url) {
      Log.warn('received empty url, ignore!');
      return;
    }
    const op = parseUrl(url);

    setUrlOption((prev) => {
      if (autoPopState && (prev?.pathname !== op.pathname || prev?.hash !== op.hash)) {
        Log.info('auto popstate');
        window.dispatchEvent(
            createPopStateEvent(window.history.state)
        );
      }
      return op;
    });
  });


  useEffect(()=>{
    const originalPush = topWindow.history?.pushState;
    const originalReplace = topWindow.history?.replaceState;
    const originalAddEventListener = topWindow.addEventListener;
    const originalRemoveEventListener = topWindow.removeEventListener;
    topWindow.history.pushState = (...args) => {
      originalPush.apply(topWindow.history, args);
      onStateChange(args[0], args[2] as any, 'pushState');
    };
    topWindow.history.replaceState = (...args) => {
      originalReplace.apply(topWindow.history, args);
      onStateChange(args[0], args[2] as any, 'replaceState');
    };

    topWindow.addEventListener = (eventName:string, handler: any, ...args:Array<any>) => {
      if (refEventsPool.current && eventName && HIJACK_EVENTS_NAME.test(eventName) && typeof handler === 'function') {
        refEventsPool.current[eventName]?.indexOf(handler) === -1 && refEventsPool.current[eventName].push(handler);
      }
      return originalAddEventListener.apply(topWindow, [eventName, handler, ...args] as any);
    };
    topWindow.removeEventListener = (eventName:string, handler:any, ...args:Array<any>)=> {
      if (eventName && HIJACK_EVENTS_NAME.test(eventName)) {
        const eventsList = refEventsPool.current[eventName];
        eventsList?.indexOf(handler) > -1 && (refEventsPool.current[eventName] = eventsList.filter((fn) => fn !== handler));
      }
      return originalRemoveEventListener.apply(topWindow, [eventName, handler, ...args] as any);
    };

    const onPopState = (e: PopStateEvent) => {
      if ((e as any).medusa) {
        return;
      }
      const op = parseUrl(location.href);
      setUrlOption(op);
    };

    topWindow.addEventListener('popstate', onPopState, false);

    return () => {
      topWindow.history.pushState = originalPush;
      topWindow.history.replaceState = originalReplace;
      topWindow.addEventListener = originalAddEventListener;
      topWindow.removeEventListener = originalRemoveEventListener;
      topWindow.removeEventListener('popstate', onPopState, false);
    };
  }, [onStateChange]);

  useEventsCall(refEventsPool);

  return {
    urlOption,
    setUrlOption
  };
};


const useEventsCall = (refEventsPool: React.MutableRefObject<Record<string, any[]>>)=> useCallback((eventArgs?: {type:string} | Array<{type:string}>)=>{
  if (!eventArgs) {
    return;
  }
  if (!Array.isArray(eventArgs)) {
    eventArgs = [eventArgs];
  }
  const name = eventArgs[0].type;
  if (!HIJACK_EVENTS_NAME.test(name)) {
    return;
  }
  refEventsPool.current[name]?.forEach((handler) => handler.apply(topWindow, eventArgs));
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

export const useDebugMap = (options: {
  urlMapPrefix?: string
  query?: any
  setStarted: (b: boolean) => void
  onError: (e:string) => void
}) => {
  const {urlMapPrefix, query, onError, setStarted} = options;
  const prefix = options.urlMapPrefix || '_tyPathMap';
  const debugUrl = useMemo(()=> query?.[prefix], [prefix, query]);
  const [debugUrlMap, setDebugUrlMap] = useState<Record<string, {js?: Array<string>, css?: Array<string>}>>();
  const [pending, setPending] = useState(debugUrl ? true : false);

  useEffect(()=>{
    if (!debugUrl) {
      return;
    }
    setStarted(false);
    setPending(true);
    fetch(debugUrl).then((resp)=>resp.json()).then((res)=>{
      setDebugUrlMap(res);
      setPending(false);
    }).catch((err)=>{
      onError(err.message || err.msg);
    }).finally(() =>{
      setStarted(true);
    });
  }, [debugUrl, onError, setStarted]);

  return {
    pending,
    debugUrlMap
  };
};

export const usePickChildren = (props: {
  children?: React.ReactNode
  isHash?: boolean
  hash?: string
  pathname?: string
  debugPending?: boolean
}) => {
  const {children, isHash, hash, pathname, debugPending} = props;
  const $ele = useMemo(()=>{
    if (typeof window === 'undefined' || debugPending) {
      return null;
    }
    for (const child of React.Children.toArray(children)) {
      if (!React.isValidElement(child)) {
        continue;
      }
      if (child.type !== Route) {
        console.error('Router only accept <Route /> as children!');
        continue;
      }
      const childProps = child.props as IRouteProps;
      if (!childProps.path) {
        continue;
      }
      const regPath = new Layer(childProps.path);
      const url = isHash ? hash : pathname;
      regPath.match(url || '/', {exact: childProps.exact});
      if (!!regPath.isMatched) {
        return {
          element: child,
          layer: regPath
        };
      }
    }
  }, [children, isHash, hash, pathname, debugPending]);
  return $ele;
};

/**
 * 当路由事件没人消费，就交由最外层的基座处理
 */
export const useRouterListen = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || window !== topWindow) {
      return;
    }

    if (!router.getValue()) {
      router.initValue({
        as: window.next?.router?.asPath || window.location.pathname,
        url: ''
      });
    }

    const unlisten = router.listen((method, url, as) => {
      if (window.next && window.next.router) {
        if (method === 'replaceState') {
          window.next.router.replace(url, as);
        } else {
          window.next.router.push(url, as);
        }
        router.broadcast();
        return true;
      }
      if (method === 'replaceState') {
        appHistory.replace(as);
      } else {
        appHistory.push(as);
      }
      router.broadcast();
      return true;
    });

    return () => {
      unlisten();
    };
  }, []);
};


export const useBrowserHistory = (pathname?: string) => {
  useEffect(() => {
    if (pathname) {
      browserRouter.dispatch(pathname);
    }
  }, [pathname]);
};


export const usePathChange = (pathname?: string, sandbox?: Sandbox) => {
  const refInited = useRef(false);

  useEffect(() => {
    if (!pathname || !sandbox) {
      return;
    }
    if (!refInited.current) {
      refInited.current = false;
      return;
    }
    sandbox.dispatchPathChange(pathname);
  }, [pathname, sandbox]);
};

export const usePrefetch = (props: {
  children?: React.ReactNode
  prefetch?: boolean | string[]
}) => {
  const checkPrefetch = usePersistFn(() => {
    if (!props.prefetch) {
      return;
    }
    const arry: IRouteProps[] = [];
    const fetchAll = typeof props.prefetch === 'boolean' && props.prefetch;
    const appList = Array.isArray(props.prefetch) ? props.prefetch : [];
    for (const child of React.Children.toArray(props.children)) {
      if (!React.isValidElement(child)) {
        continue;
      }
      if (child.type !== Route) {
        continue;
      }
      const childProps = child.props as IRouteProps;
      if (fetchAll) {
        arry.push(childProps);
        continue;
      } else if (childProps.appId && appList.includes(childProps.appId)) {
        arry.push(childProps);
      }
    }
    if (arry.length) {
      Log.info('starting prefetch', arry);
      prefetch(arry);
    }
  });

  /**
   * 只判断一次
   */
  useEffect(() => {
    checkPrefetch();
  }, [checkPrefetch]);
};
