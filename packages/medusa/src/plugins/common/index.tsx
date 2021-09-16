import React, {useContext, useRef, useState, useEffect} from 'react';
import {RouteContext} from '../../context';
import {startApp} from '../../packages/app';
import {IRouteProps} from '../../route';
import {useStarApp} from './hooks';

export const genRandomAppId = () => {
  return Math.random().toString(16).slice(2);
};

export const useCommonLifecycle = (props: IRouteProps, useAppLifecycle: typeof useStarApp) => {
  const context = useContext(RouteContext)!;
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);

  const {appId: defaultId, rootId: defaultRootId, ...restContext} = context;

  /**
   * 请注意路由一旦创建就不允许变更，频繁变化会带来很多问题
   */
  const [freezeOptions] = useState(() => Object.freeze({
    ...restContext,
    ...props,
    defaultId,
    defaultRootId,
  }));

  useEffect(()=>{
    freezeOptions?.onAppLoading(loading);
  }, [loading, freezeOptions]);

  useEffect(()=>{
    if (err) {
      freezeOptions.onAppError(err);
    }
  }, [err, freezeOptions]);

  /**
   * loadApp函数地址不会变化
   */
  const {loadApp, unloadApp} = useAppLifecycle({
    passProps: freezeOptions,
    setLoading,
    ref,
  });

  useEffect(()=>{
    setErr(undefined);
    if (freezeOptions.appId) {
      freezeOptions.onAppEnter?.(freezeOptions.appId);
      startApp(freezeOptions.appId);
    }
    loadApp().catch((err)=>{
      setErr(err?.msg || err?.message || '资源加载出错了。。。');
    });
    return () => {
      unloadApp();
    };
  }, [freezeOptions, loadApp, unloadApp]);

  return ref;
};

export const PluginCommonRoute: React.FC<IRouteProps> = (props) => {
  const ref = useCommonLifecycle(props, useStarApp);

  return <div ref={ref} />;
};
