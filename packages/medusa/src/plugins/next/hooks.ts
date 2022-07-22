import React, {useEffect, useRef} from 'react';
import {IRouteProps} from '../../route';
import Sandbox from '../../sandbox';
import {parseAssets} from '../../utils/assets';
import usePersistFn from '../../hooks/use-persist-fn';
import {appendAssets} from '../common/assets';
import {beforeStartApp, beforeStopApp, IRestContext, useProps} from '../common/hooks';
import Log from '../../utils/log';


export const useCheckNext = (children?: React.ReactNode) => {
  useEffect(() => {
    const targetId = `${Math.random().toString(16).substr(2, 8)}__next`;
    let nextHost: HTMLElement|null = null;
    for (const ele of React.Children.toArray(children)) {
      if (React.isValidElement(ele)) {
        const props = ele.props;
        if (props.framework === 'next' || props.framework === 'ty-next') {
          nextHost = document.getElementById('__next');
        }
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
  const {passProps, ref, setLoading} = options;

  const refSandbox = useRef<Sandbox>();

  const refIdList = useRef<Array<string>>([]);

  const refContainer = useRef<HTMLDivElement>();

  const props = useProps(passProps);

  const domId = props.rootId || '__next';

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
    refUnmounted.current = false;

    const {
      jsList,
      cssList,
      assetPublicPath,
      execScripts,
      getExternalStyleSheets,
    } = await parseAssets({
      ...props,
      next: props.html,
      html: undefined,
      onUrlFix: props.onUrlFix,
    }, props.layer);


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
        framework: 'next',
        assetPublicPath,
        nextVersion: props.tyNextVersion,
        excludeAssetFilter: props.excludeAssetFilter,
        injectGlobals: props.injectGlobals,
      });
    }

    const sandbox = refSandbox.current;

    const cssContents = getExternalStyleSheets ? await getExternalStyleSheets() : [];
    const {idList, jsSourceList} = await appendAssets({
      cssList,
      styleList: cssContents.filter((t) => !t.attrs?.find((t) => t.key.includes('data-next-dev-hide-body'))),
      jsList,
      container: ele,
      scopeCss: props.scopeCss,
    });

    refIdList.current = idList;
    jsSourceList.map((str) => {
      sandbox.execScriptInSandbox(str);
    });

    await execScripts?.(sandbox);

    if (checkUnmounted()) {
      sandbox.clear();
      return;
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
