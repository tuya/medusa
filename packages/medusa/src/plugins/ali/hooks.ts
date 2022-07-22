import React, {useRef} from 'react';
import {IRouteProps} from '../../route';
import Sandbox from '../../sandbox';
import {parseAssets} from '../../utils/assets';
import usePersistFn from '../../hooks/use-persist-fn';
import {appendAssets} from '../common/assets';
import {getGlobalProp, noteGlobalProps} from '../../utils/umd';
import {setCache} from './icestark';
import {beforeStartApp, beforeStopApp, IRestContext, useProps} from '../common/hooks';
import Log from '../../utils/log';

export const useStarApp = (options: {
  passProps: IRouteProps & IRestContext
  ref: React.MutableRefObject<HTMLDivElement|null>
  setLoading: (b: boolean) => void

}) => {
  const {passProps, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const props = useProps(passProps);

  const domId = props.rootId || (props.framework === 'qiankun' ? 'root' : props.defaultRootId);

  const refContainer = useRef<HTMLDivElement>();

  const refUnmounted = useRef(false);
  const checkUnmounted = usePersistFn(() => {
    if (refUnmounted.current) {
      Log.warn('子应用已被卸载，取消继续执行。');
      return true;
    }
    return false;
  });

  const loadApp = usePersistFn(async () => {
    if (!ref.current) {
      return;
    }

    const {ele, basename} = beforeStartApp({props, ref, setLoading, domId});

    refContainer.current = ele;

    setCache('root', 'medusa');

    const {jsList, cssList, assetPublicPath, execScripts, getExternalStyleSheets} = await parseAssets(props, props.layer);

    if (checkUnmounted()) {
      return;
    }

    if (!refSandbox.current) {
      refSandbox.current = new Sandbox({
        globals: props.globalVars,
        appId: props.appId,
        basename,
        path: props.path,
        container: ele,
        framework: props.framework,
        assetPublicPath,
        props: props.props,
        excludeAssetFilter: props.excludeAssetFilter,
      });
    }

    const sandbox = refSandbox.current;

    const cssContents = await getExternalStyleSheets?.() || [];

    const {idList, jsSourceList} = await appendAssets({
      cssList,
      styleList: cssContents,
      jsList,
      container: ele,
      scopeCss: props.scopeCss === true ? 'property' : props.scopeCss
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
    if (checkUnmounted()) {
      return sandbox.clear();
    }
    sandbox.runFinal();
    setLoading(false);
  });

  const unloadApp = usePersistFn(async () => {
    beforeStopApp({props, container: refContainer.current, sandBox: refSandbox.current, idList: refIdList.current});
    refSandbox.current = undefined;
    refUnmounted.current = true;
  });

  return {
    loadApp,
    unloadApp
  };
};
