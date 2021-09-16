import React, {useEffect, useMemo, useState} from 'react';
import * as appHistory from './packages/appHistory';
import {getBasename} from './packages/app';

import router from './packages/router-system';
import browserHistory from './packages/browser-history';


export const useRouter = () => {
  const [routeProps, setRouteProps] = useState<{url: string, as: string}|null>(router.getValue());

  useEffect(() => {
    const func = (option: {url: string, as: string}) => {
      setRouteProps(option);
    };
    router.onEvent(func);
    return () => {
      router.offEvent(func);
    };
  }, []);

  const obj = useMemo(() => {
    const win: Window | null = typeof window === 'undefined' ? null : window;
    const pathname = routeProps?.url || ( win?.next?.router?.pathname) || '';
    const asPath = routeProps?.as || ( win?.next?.router?.asPath) || '';
    return {
      pathname,
      asPath,
      isMatch: asPath.indexOf(getBasename()) === 0,
      /**
       * 如果要跨项目跳转，请设置autoBasename为false, 因为我们也判断不出来要不要在as这里加basename
       */
      push: (url: string, as?: string, option = {autoBasename: true}) => {
        router.push(url, as, option);
      },
      replace: (url: string, as?: string, option = {autoBasename: true}) => {
        router.replace(url, as, option);
      },
    };
  }, [routeProps]);

  return obj;
};

export const useBrowserHistory = () => {
  const [pathname, setPathname] = useState(browserHistory.current);

  useEffect(() => {
    const dispose = browserHistory.listen((url) => {
      setPathname(url);
    });
    dispose();
  }, []);

  const obj = useMemo(() => {
    return {
      pathname,
      push: (url: string) => {
        appHistory.push(url);
      },
      replace: (url: string) => {
        appHistory.replace(url);
      },
    };
  }, [pathname]);

  return obj;
};
