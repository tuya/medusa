/* eslint-disable semi */

import JDMicroApp from './app';
import {lifeCycles} from './lifecycle';
import {RouteContext} from '../../context';
import {IRouteProps} from '../../route';
import {genRandomAppId} from '../common';
import {parseBaseName} from '../../utils/url';
import {setBasename} from '../../packages/app';
import React, {useContext, useEffect, useMemo, useState} from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'micro-app': React.DetailedHTMLProps<any, HTMLElement>;
    }
  }
}

export const PluginZoeRoute: React.FC<IRouteProps> = (props) => {
  const context = useContext(RouteContext)!;
  const {appId: defaultId, rootId: defaultRootId, ...restContext} = context;

  const [freezeOptions] = useState(() => Object.freeze({
    ...restContext,
    ...props,
    defaultId,
    defaultRootId,
    appId: props.appId || genRandomAppId()
  }));

  const baseurl = useMemo(()=> {
    return parseBaseName(freezeOptions.path, freezeOptions.basename, freezeOptions.layer?.result?.params);
  }, [freezeOptions])

  useEffect(() => {
    setBasename(freezeOptions.appId, baseurl);

    const dispose = JDMicroApp.getInstance().on(freezeOptions.appId, (e: lifeCycles) => {
      if (e === lifeCycles.BEFOREMOUNT) {
        freezeOptions.onAppLoading(true)
      } else if (e === lifeCycles.MOUNTED) {
        freezeOptions.onAppLoading(false)
      } else if (e === lifeCycles.ERROR) {
        freezeOptions.onAppError('app load error')
      }
    })

    return () => {
      setBasename(freezeOptions.appId, undefined)
      dispose()
    }
  }, [baseurl, freezeOptions])

  return <micro-app name={freezeOptions.appId} url={props.html} baseurl={baseurl} />
};
