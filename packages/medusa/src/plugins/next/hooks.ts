import React, {useEffect, useRef} from 'react';
import {IRouteProps} from '../../route';
import Sandbox from '../../sandbox';
import {parseAssets} from '../../utils/assets';
import usePersistFn from '../../hooks/use-persist-fn';
import {appendAssets} from '../common/assets';
import {beforeStartApp, beforeStopApp, IRestContext} from '../common/hooks';
import Log from '../../utils/log';


export const useCheckNext = (children?: React.ReactNode) => {
  useEffect(() => {
    const targetId = `${Math.random().toString(16).substr(2, 8)}__next`;
    let nextHost: HTMLElement|null = null;
    for (const ele of React.Children.toArray(children)) {
      if (React.isValidElement(ele) && ele.props.next) {
        nextHost = document.getElementById('__next');
        break;
      }
    }
    if (nextHost) {
      Log.info('rename __next dom');
      nextHost.setAttribute('id', targetId);
      return () => {
        nextHost?.setAttribute('id', '__next');
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const useStarApp = (options: {
  passProps: IRouteProps & IRestContext
  ref: React.MutableRefObject<HTMLDivElement|null>
  setLoading: (b: boolean) => void

}) => {
  const {passProps: props, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const domId = props.rootId || '__next';

  const loadApp = usePersistFn(async () => {
    if (!ref.current) {
      return;
    }
    const {assetsOptions, ele, basename} = beforeStartApp({props, ref, setLoading, domId});

    const {
      jsList,
      cssList,
      assetPublicPath,
      execScripts,
      getExternalStyleSheets,
    } = await parseAssets({...assetsOptions, next: props.next || props.html, html: undefined}, props.layer);

    if (!refSandbox.current) {
      refSandbox.current = new Sandbox({
        globals: props.globalVars,
        appId: props.appId,
        basename,
        path: props.path,
        container: ele,
        framework: 'next',
        assetPublicPath,
        nextVersion: props.tyNextVersion,
      });
    }

    const sandbox = refSandbox.current;

    if (!sandbox.getSandbox()) {
      sandbox.init();
    }

    const cssContents = getExternalStyleSheets ? await getExternalStyleSheets() : [];

    const {idList, jsSourceList} = await appendAssets({
      cssList,
      styleList: cssContents,
      jsList
    });

    refIdList.current = idList;
    jsSourceList.map((str) => {
      sandbox.execScriptInSandbox(str);
    });

    await execScripts?.(sandbox);
    sandbox.runFinal();
    setLoading(false);
  });

  const unloadApp = usePersistFn(async () => {
    beforeStopApp({props, domId, sandBox: refSandbox.current, idList: refIdList.current});
    refSandbox.current = undefined;
  });

  return {
    loadApp,
    unloadApp
  };
};
