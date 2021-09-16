import React, {useContext, useEffect, useRef, useState} from 'react';
import {IRouteProps} from '../..';
import {RouteContext} from '../../context';
import {startApp} from '../../packages/app';

export const PluginPeerRoute:React.FC<IRouteProps> = (props) => {
  const context = useContext(RouteContext)!;

  const {appId: defaultId, rootId: defaultRootId, ...restContext} = context;


  const [freezeOptions] = useState(() => Object.freeze({
    ...restContext,
    ...props,
  }));

  useEffect(()=>{
    freezeOptions?.onAppLoading(false);
  }, [freezeOptions]);

  useEffect(()=>{
    freezeOptions.onAppError(undefined);
  }, [freezeOptions]);

  useEffect(()=>{
    if (!freezeOptions.appId) {
      return;
    }
    freezeOptions.onAppEnter?.(freezeOptions.appId);
    startApp(freezeOptions.appId);
    return () => {
      freezeOptions.appId && freezeOptions.onAppLeave?.(freezeOptions.appId);
    };
  }, [freezeOptions]);

  return <div>
    {React.Children.map(props.children, (c)=>{
      if (React.isValidElement(c)) {
        return React.cloneElement(c, {params: context.layer?.result?.params});
      }
      return c;
    })}
  </div>;
};
