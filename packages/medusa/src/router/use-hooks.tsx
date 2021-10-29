import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {HIJACK_EVENTS_NAME, topWindow} from '../common';
import {parseUrl} from '../utils/url';
import Route, {IRouteProps} from '../route';
import Layer from '../utils/path';
import router from '../packages/router-system';
import browserRouter from '../packages/browser-history';

import {appHistory} from '../link';
import Sandbox from '../sandbox';

export const useHistoryEvents = (options: {
  onStateChange: (evt: PopStateEvent, url?: string|null, routeType?: 'pushState' | 'replaceState') => void
  onUrlChange: (url: {pathname:string, query: string, hash:string}) => void
}) => {
  const {onUrlChange, onStateChange} = options;

  const refEventsPool = useRef<{[key:string]:Array<any>}>({
    hashchange: [],
    popstate: [],
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
      onUrlChange(parseUrl(location.href));
    };

    topWindow.addEventListener('popstate', onPopState, false);

    return () => {
      topWindow.history.pushState = originalPush;
      topWindow.history.replaceState = originalReplace;
      topWindow.addEventListener = originalAddEventListener;
      topWindow.removeEventListener = originalRemoveEventListener;
      topWindow.removeEventListener('popstate', onPopState, false);
    };
  }, [onUrlChange, onStateChange]);

  return refEventsPool;
};


export const useEventsCall = (refEventsPool: React.MutableRefObject<Record<string, any[]>>)=> useCallback((eventArgs?: {type:string} | Array<{type:string}>)=>{
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
