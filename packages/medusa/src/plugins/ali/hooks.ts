import React, {useRef} from 'react';
import {IRouteProps} from '../../route';
import Sandbox from '../../sandbox';
import {parseAssets} from '../../utils/assets';
import usePersistFn from '../../hooks/use-persist-fn';
import {appendAssets} from '../common/assets';
import {getGlobalProp, noteGlobalProps} from '../../utils/umd';
import {setCache} from './icestark';
import {beforeStartApp, beforeStopApp, IRestContext} from '../common/hooks';

export const useStarApp = (options: {
  passProps: IRouteProps & IRestContext
  ref: React.MutableRefObject<HTMLDivElement|null>
  setLoading: (b: boolean) => void

}) => {
  const {passProps: props, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const domId = props.rootId || props.defaultRootId;

  const loadApp = usePersistFn(async () => {
    if (!ref.current) {
      return;
    }

    const {assetsOptions, ele, basename} = beforeStartApp({props, ref, setLoading, domId});

    setCache('root', 'medusa');

    const {jsList, cssList, assetPublicPath, execScripts, getExternalStyleSheets} = await parseAssets(assetsOptions, props.layer);

    if (!refSandbox.current) {
      refSandbox.current = new Sandbox({
        globals: props.globalVars,
        appId: props.appId,
        basename,
        path: props.path,
        container: ele,
        framework: props.framework,
        assetPublicPath,
      });
    }

    const sandbox = refSandbox.current;

    if (!sandbox.getSandbox()) {
      sandbox.init();
    }

    const cssContents = await getExternalStyleSheets?.() || [];

    const {idList, jsSourceList} = await appendAssets({
      cssList,
      styleList: cssContents,
      jsList
    });

    refIdList.current = idList;

    jsSourceList.map((str, index) => {
      sandbox.execScriptInSandbox(str);
      const needExports = props.framework && index === jsSourceList.length - 1;
      if (needExports) {
        noteGlobalProps(sandbox.getSandbox());
      }
      sandbox.execScriptInSandbox(str);
      if (needExports) {
        const exps = getGlobalProp(sandbox.getSandbox());
        sandbox.lifecycle = exps;
      }
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
