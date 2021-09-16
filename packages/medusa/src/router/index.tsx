import {topWindow, initApp} from '../common';
import {startApp, stopApp} from '../packages/app';
import {parseUrl} from '../utils/url';
import queryString from 'query-string';
import {RouteContextProvider} from '../context';
import usePersistFn from '../hooks/use-persist-fn';
import {useCheckNext} from '../plugins/next/hooks';
import {useCheckZoe} from '../plugins/jd-micro/hooks';
import React, {useEffect, useMemo, useState} from 'react';
import {useBrowserHistory, useDebugMap, useEventsCall, useHistoryEvents, usePickChildren, useRouterListen} from './use-hooks';

export interface IRouterProps {
  hash?: boolean
  NotFoundContent?: React.ReactElement
  devTool?: boolean // todo
  LoadingComponent?: React.ReactElement
  urlMapPrefix?: string

  /**
   * 整个路由的appId，只有在多个路由系统一起工作的时候需要填写，用于区分
   */
  appId?: string
}

initApp();

const Router:React.FC<IRouterProps> = (props) => {
  const appId = useMemo(()=>props.appId || topWindow.tyMicroApp?.defaultAppId, [props.appId]);
  const [isStarted, setStarted] = useState(false);
  const [errStr, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);

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

  const onStateChange = usePersistFn((evt: PopStateEvent, url?: string|null, routeType?: 'pushState' | 'replaceState')=>{
    if (!url) {
      return setUrlOption(null);
    }
    const pUrl = parseUrl(url);
    setUrlOption(pUrl);
    // return setHref(`${location.protocol}//${location.host}${props.hash?'/#':''}${url}`);
  });

  const refEventsPool = useHistoryEvents({
    onStateChange,
    onUrlChange: setUrlOption
  });

  // 对目前的框架来说没啥用，后期可能有空，先留着
  useEventsCall(refEventsPool);

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

  if (!appId) {
    return <div>something is wrong, no appId!!</div>;
  }

  if (errStr) {
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
  >
    {loading? props.LoadingComponent || <div>loading...</div> : null}
    {pickedChild ? pickedChild.element : props.NotFoundContent}
  </RouteContextProvider>;
};

export default Router;
