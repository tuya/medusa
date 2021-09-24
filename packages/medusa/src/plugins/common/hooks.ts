import ReactDOM from 'react-dom';
import React, {useRef} from 'react';
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
}

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
  ref.current!.appendChild(ele);

  props.appId && setMountedNode(props.appId, ele.id);
  setMountedNode(props.defaultId, ele.id);

  setLoading(true);

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
  return {assetsOptions, ele, basename};
};

export const beforeStopApp = (options: {
  props: IRouteProps & IRestContext
  domId: string
  sandBox?: Sandbox
  idList?: string[]
}) => {
  const {props, domId, sandBox, idList} = options;

  if (props.autoUnmount) {
    const ele = document.getElementById(domId) as any;
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
  const {passProps: props, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const domId = props.rootId || props.defaultRootId;

  const loadApp = usePersistFn(async () => {
    if (!ref.current) {
      return;
    }

    const {assetsOptions, ele, basename} = beforeStartApp({props, ref, setLoading, domId});
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
      jsList,
      container: props.scopeCss ? ele : undefined
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
