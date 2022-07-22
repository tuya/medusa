import ReactDOM from 'react-dom';
import React, {useMemo, useRef} from 'react';
import Layer from '../../utils/path';
import {IRouteProps} from '../../route';
import Sandbox from '../../sandbox';
import {appendAssets} from '../common/assets';
import {parseAssets} from '../../utils/assets';
import usePersistFn from '../../hooks/use-persist-fn';
import {getGlobalProp, noteGlobalProps} from '../../utils/umd';
import {setBasename, setMountedNode, stopApp} from '../../packages/app';
import {parseBaseName} from '../../utils/url';
import Log from '../../utils/log';

export type IRestContext = {
  defaultId: string
  defaultRootId: string
  urlMap?: {[key:string]:{js?: Array<string>, css?: Array<string>}}
  layer?: Layer
  queryStr?: string
  onAppEnter?: (id: string) => void
  onAppLeave?: (id:string) => void
  onAppLoading: (b: boolean) => void
  onAppError: (str?: string) => void
  fetch?: typeof fetch
  getTemplate?: (tpl: string) => string
}

export const useProps = (props: IRouteProps & IRestContext) => {
  return useMemo(() => {
    let assetsOptions = {...props, query: props.queryStr};

    if (props.urlMap) {
      for (const pathname in props.urlMap) {
        const layer = new Layer(pathname);
        layer.match(props.path);
        if (layer.isMatched) {
          const obj = props.urlMap[pathname] || {};
          assetsOptions = {...assetsOptions, ...obj};
          break;
        }
      }
    }
    return assetsOptions;
  }, [props]);
};

export const beforeStartApp = (options: {
  props: IRouteProps & IRestContext
  ref: React.MutableRefObject<HTMLDivElement|null>
  setLoading: (b: boolean) => void
  domId: string
}) => {
  const {props, ref, domId, setLoading} = options;

  const basename = parseBaseName(props.path, props.basename, props.layer?.result?.params);
  /**
   * 老版本的会挂载到全局appId上，做个低版本兼容，后续用不到了
   */
  props.appId && setBasename(props.appId, basename);
  setBasename(props.defaultId, basename);
  Log.info('setBasename', basename);

  ref.current!.innerHTML = '';
  const ele = document.createElement('div');
  ele.id = domId;
  ele.innerHTML = props.initHtmlStr || '';
  ele.setAttribute('data-medusa', ele.id);
  ref.current!.appendChild(ele);

  props.appId && setMountedNode(props.appId, ele.id);
  setMountedNode(props.defaultId, ele.id);

  setLoading(true);

  return {ele, basename};
};

export const beforeStopApp = (options: {
  props: IRouteProps & IRestContext
  container?: HTMLDivElement
  sandBox?: Sandbox
  idList?: string[]
}) => {
  const {props, container, sandBox, idList} = options;

  if (props.autoUnmount) {
    const ele = container as any;
    if (ele?._reactRootContainer?.unmount) {
      Log.info('Auto unmount react node!');
      ele._reactRootContainer.unmount();
    }
  }

  setMountedNode(props.defaultId, undefined);
  props.appId && setMountedNode(props.appId, undefined);
  setBasename(props.defaultId, undefined);
  props.appId && setBasename(props.appId, undefined);

  sandBox?.clear();
  idList?.map((id)=>{
    const ele = document.getElementById(id);
    if (ele) {
      ele.remove();
    }
  });
  if (props.appId) {
    props.onAppLeave?.(props.appId);
    stopApp(props.appId);
  }
};

export const useStarApp = (options: {
  passProps: IRouteProps & IRestContext
  ref: React.MutableRefObject<HTMLDivElement|null>
  setLoading: (b: boolean) => void

}) => {
  const {passProps, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const refContainer = useRef<HTMLDivElement>();

  const props = useProps(passProps);

  const domId = props.rootId || props.defaultRootId;

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
      scopeCss: props.scopeCss
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
