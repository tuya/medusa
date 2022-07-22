import {topWindow, initApp} from '../common';
import {startApp, stopApp} from '../packages/app';
import {parseUrl} from '../utils/url';
import queryString from 'query-string';
import {RouteContextProvider} from '../context';
import usePersistFn from '../hooks/use-persist-fn';
import {useCheckNext} from '../plugins/next/hooks';
import {useCheckZoe} from '../plugins/jd-micro/hooks';
import React, {useEffect, useMemo, useState} from 'react';
import {useBrowserHistory, useDebugMap, useHistoryEvents, usePickChildren, usePrefetch, useRouterListen} from './use-hooks';
import Log from '../utils/log';
import JDMicroApp from '../plugins/jd-micro/app';

export interface IRouterProps {
  hash?: boolean
  NotFoundContent?: React.ReactElement
  devTool?: boolean // todo
  LoadingComponent?: React.ReactElement
  ErrorComponent?: React.ReactElement
  urlMapPrefix?: string

  /**
   * 整个路由的appId，只有在多个路由系统一起工作的时候需要填写，用于区分
   */
  appId?: string

  /**
   * 是否启动prefetch功能，可以传递数组，数组参数为子路由指定的appId
   */
  prefetch?: boolean | string[]

  /**
   * 调用pushState或者replaceSate时，是否自动调用popState。因为react-router是基于popState的。
   * 所以主项目pushState并不会使得react-router生效。但是qiankun基于single-spa。single-spa实现了自动pop的逻辑。
   * 所以为了兼容，做了这个参数。酌情添加。
   */
  autoPopState?: boolean

  onAppEnter?: (id: string) => void

  fetch?: typeof fetch


}

initApp();

const Router:React.FC<IRouterProps> = (props) => {
  const appId = useMemo(()=>props.appId || topWindow.tyMicroApp?.defaultAppId, [props.appId]);
  const [isStarted, setStarted] = useState(false);
  const [errStr, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);

  useCheckNext(props.children);
  useCheckZoe(props.children);

  useEffect(()=>{
    if (!appId) {
      return;
    }
    startApp(appId);
    setStarted(true);
    return () => {
      stopApp(appId);
      setStarted(false);
    };
  }, [appId]);


  const {urlOption} = useHistoryEvents({
    autoPopState: props.autoPopState
  });

  const {pathname, query, hash, searchStr} = useMemo(()=>{
    if (!urlOption) {
      return {};
    }
    return {
      pathname: urlOption.pathname,
      query: queryString.parse(urlOption.query || ''),
      hash: urlOption.hash || '/',
      searchStr: urlOption.query
    };
  }, [urlOption]);

  const {debugUrlMap, pending: debugPending} = useDebugMap({
    onError: setErr,
    query,
    urlMapPrefix: props.urlMapPrefix,
    setStarted
  });

  const pickedChild = usePickChildren({
    children: props.children,
    pathname,
    hash,
    isHash: props.hash,
    debugPending
  });

  useEffect(() => {
    setErr(undefined);
  }, [pickedChild?.element]);

  const onAppLoading = usePersistFn((v: boolean) => {
    setErr(undefined);
    setLoading(v);
  });

  useRouterListen();

  useBrowserHistory(props.hash ? hash : pathname);

  usePrefetch(props);

  if (!appId) {
    return <div>something is wrong, no appId!!</div>;
  }

  if (errStr) {
    if (props.ErrorComponent) {
      return React.cloneElement(props.ErrorComponent, {}, errStr);
    }
    return <div style={{color: 'red'}}>{errStr}</div>;
  }

  if (!isStarted) {
    return null;
  }

  return <RouteContextProvider
    appId={appId}
    rootId="tuya-micro-container"
    urlMap={debugUrlMap}
    layer={pickedChild?.layer}
    queryStr={searchStr}
    onAppLoading={onAppLoading}
    onAppError={setErr}
    pathname={props.hash ? hash : pathname}
    onAppEnter={props.onAppEnter}
    fetch={props.fetch}
  >
    {loading? props.LoadingComponent || <div>loading...</div> : null}
    {pickedChild ? pickedChild.element : props.NotFoundContent}
  </RouteContextProvider>;
};

export const startMicro = () => {
  JDMicroApp.getInstance().start();
};

export default Router;
