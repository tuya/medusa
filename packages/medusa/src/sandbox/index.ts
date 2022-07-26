// based on https://github.com/ice-lab/icestark/tree/master/packages/icestark-sandbox

import Log from '../utils/log';
import PluginSystem from './plugins';
import NextPlugin from './plugins/next';
import {TY_GLOBAL_VALUES} from './globals';
import {isWindowFunction} from '../utils/proxys/fn';
import WebpackPlugin from './plugins/webpack';
import CommonPlugin from './plugins/common';
import IceStarkPlugin from './plugins/icestark';
import ZoePlugin from './plugins/zoe';
import {listenNativeEvents, listenRoutes} from './listener';
import {ILifecycle, validateExportLifecycle} from '../plugins/ali/qiankun';
import {
  topWindow,
  TY_STORE_CACHE_LIST_VAR,
  TY_SUB_APP_ID, TY_SUB_BASE_NAME, TY_SUB_MOUNT_CALLBACK,
  TY_SUB_PUBLIC_PATH, TY_SUB_UNMOUNT_CALLBACK
} from '../common';
declare global {
  interface Window {
    _tyGlobalWindow?: any
    _currentSandbox?: any
    [TY_STORE_CACHE_LIST_VAR]?: Array<{unsubscribe?: () => void}>
    next?: {
      router?: {
        push: (url: string, as?: string) => void,
        replace: (url: string, as?: string) => void
        asPath: string
        pathname: string
      },
      changeState: (
        method: 'pushState' | 'replaceState',
        url: string,
        as: string,
      ) => void
    }
  }
}

// based on icestark-sandbox
export default class Sandbox {
  private _pluginSystem: PluginSystem

  private _toGlobals:Array<string> = []

  private eventListeners:{[key:string]: any} = {}
  private timeoutIds: number[] = []
  private intervalIds: number[] = []

  private propertyAdded:any = {};
  private originalValues:any = {};

  private _needToClear:Record<any, any> = {};
  private _appId?: string
  private _basename?: string
  private _path: string | undefined
  private _isNext = false

  private _unlisten: Function | undefined | null = null
  private _frameWorkUnmount: Function | undefined
  private _container: HTMLElement | string | undefined
  private _assetPublicPath: string | undefined

  public lifecycle: ILifecycle | string | undefined
  public sandbox: Window | undefined;

  private _initSandbox?: Record<string, any>

  private _unmounted?: boolean

  private _initialProps?: Record<string, any>

  constructor(options?: {
    globals?: Array<string>,
    appId?: string,
    basename?: string,
    path: string
    container: HTMLElement | string
    framework?: 'icestark' | 'qiankun' | 'zoe' | 'next' | 'ty-next'
    assetPublicPath?: string
    nextVersion?: number,
    props?: Record<string, any>
    excludeAssetFilter?: (assetUrl: string) => boolean
    injectGlobals?: Record<string, any>
  }) {
    if (!window.Proxy) {
      throw new Error('Sorry, window.Proxy is not defined !! ');
    }
    if (options?.globals) {
      this._toGlobals = options.globals;
    }
    this._path = options?.path;
    this._appId = options?.appId;
    this._basename = options?.basename;
    this._container = options?.container;
    this._assetPublicPath = options?.assetPublicPath;
    this._initSandbox = options?.injectGlobals;

    this._pluginSystem = new PluginSystem;
    this._pluginSystem.plugins.push(new WebpackPlugin(this._appId));

    this._initialProps = options?.props;

    if (options?.framework === 'next' || options?.framework === 'ty-next') {
      this._pluginSystem.plugins.push(new NextPlugin(
          {
            appId: this._appId,
            container: this._container as HTMLElement,
            basename: options.basename,
            nextVersion: options.nextVersion,
            excludeAssetFilter: options.excludeAssetFilter,
            assetPublicPath: options.assetPublicPath
          }
      ));
      this._isNext = true;
    } else if (options?.framework === 'icestark' || options?.framework === 'qiankun') {
      this._pluginSystem.plugins.push(new IceStarkPlugin({
        framework: options.framework,
        assetPublicPath: this._assetPublicPath,
        container: this._container,
        basename: this._basename,
        props: options.props,
        excludeAssetFilter: options.excludeAssetFilter,
        appId: this._appId
      }));
    } else if (options?.framework === 'zoe') {
      this._pluginSystem.plugins.push(new ZoePlugin(
        this._appId!,
        this._container as HTMLElement,
        this._assetPublicPath,
        this._basename
      ));
    } else {
      this._pluginSystem.plugins.push(new CommonPlugin({
        excludeAssetFilter: options?.excludeAssetFilter,
        assetPublicPath: this._assetPublicPath,
      }));
    }
  }

  listen() {
    this._unlisten = listenRoutes(this._path, this._basename, this._isNext, this.sandbox);
  }

  unlisten() {
    this._unlisten?.();
    this._unlisten = null;
  }

  init() {
    const {propertyAdded, originalValues} = this;

    const proxyWindow = Object.create(null) as Window;
    const originalWindow = window._tyGlobalWindow || window;

    listenNativeEvents(proxyWindow, this.eventListeners, this.timeoutIds, this.intervalIds);

    const _globals = this._toGlobals;
    const _needToClear = this._needToClear;

    if (this._appId) {
      proxyWindow[TY_SUB_APP_ID] = this._appId;
    }

    if (this._basename) {
      proxyWindow[TY_SUB_BASE_NAME] = this._basename;
    }

    if (this._assetPublicPath) {
      proxyWindow[TY_SUB_PUBLIC_PATH] = this._assetPublicPath;
    }

    for (const key in this._initSandbox) {
      proxyWindow[key] = this._initSandbox[key];
    }

    proxyWindow[TY_STORE_CACHE_LIST_VAR] = [];

    this._pluginSystem.init(proxyWindow);

    const sandbox = new Proxy(proxyWindow, {
      set: (target: any, p: PropertyKey, value: any): boolean => {
        if (TY_GLOBAL_VALUES.includes(p as string)) {
          if (originalWindow.hasOwnProperty(p) && !originalValues.hasOwnProperty(p)) {
            originalValues[p] = originalWindow[p];
            Log.warn('微前端全局变量已存在，正在重复设置中，请检查是否存在BUG ===>', p, value);
          }
          originalWindow[p] = value;
          _needToClear[p as string] = 1;
          Log.info('正在设置微前端全局变量 ===>', p, value);
          return true;
        }

        if (_globals.includes(p as string)) {
          if (originalWindow.hasOwnProperty(p) && !originalValues.hasOwnProperty(p)) {
            originalValues[p] = originalWindow[p];
            Log.info('正在覆盖全局变量', p, value);
          }
          originalWindow[p] = value;
          _needToClear[p as string] = 1;
          Log.info('注册全局变量 ===>', p, value);
          return true;
        }

        if (this._pluginSystem.proxySet(target, p, value, sandbox, originalWindow)) {
          return true;
        }

        if (originalWindow.hasOwnProperty(p)) {
          // Log.info('存在变量名和全局变量一致，正在隔离', p, value);
        } else {
          propertyAdded[p] = value;
        }

        // if (!originalWindow.hasOwnProperty(p)) {
        //   // recorde value added in sandbox
        //   propertyAdded[p] = value;
        // // eslint-disable-next-line no-prototype-builtins
        // } else if (!originalValues.hasOwnProperty(p)) {
        //   // if it is already been setted in orignal window, record it's original value
        //   originalValues[p] = originalWindow[p];
        // }

        target[p] = value;
        return true;
      },
      get: (target: any, p: PropertyKey): any => {
        if (p === 'isProxy') {
          return true;
        }
        if (p === Symbol.unscopables) {
          return undefined;
        }
        if (['top', 'window', 'self', 'globalThis'].includes(p as string)) {
          return sandbox;
        }
        if (p === 'eval') {
          return eval;
        }
        if (p === '_tyGlobalWindow') {
          return originalWindow[p] || originalWindow;
        }
        if (_globals.includes(p as string) || TY_GLOBAL_VALUES.includes(p as string)) {
          return originalWindow[p];
        }

        // proxy hasOwnProperty, in case of proxy.hasOwnProperty value represented as originalWindow.hasOwnProperty
        if (p === 'hasOwnProperty') {
          // eslint-disable-next-line no-prototype-builtins
          return (key: PropertyKey) => !!target[key] || originalWindow.hasOwnProperty(key);
        }

        const pluginValue = this._pluginSystem.proxyGet(target, p, sandbox, originalWindow);

        if (pluginValue !== undefined) {
          return pluginValue.value;
        }

        const targetValue = target[p];
        if (targetValue) {
          // case of addEventListener, removeEventListener, setTimeout, setInterval setted in sandbox
          return targetValue;
        }

        const value = originalWindow[p];

        if (isWindowFunction(value)) {
          // fix Illegal invocation
          return value.bind(originalWindow);
        } else {
          // case of window.clientWidth、new window.Object()
          return value;
        }
      },
      has: (target: any, key: PropertyKey): boolean => {
        const res = this._pluginSystem.proxyHas(target, key);
        if (res !== undefined) {
          return res;
        }
        return key in target || key in topWindow;
      },
    });

    Reflect.set(proxyWindow, 'self', sandbox);
    window._currentSandbox = sandbox;
    this.sandbox = sandbox;
    this.listen();
  }

  getSandbox() {
    return this.sandbox;
  }

  execScriptInSandbox(script: string, src?: string): void {
    if (this._unmounted) {
      return;
    }

    // create sandbox before exec script
    if (!this.sandbox) {
      this.init();
    }
    try {
      let execScript = `with (window) {;${script}\n}`;
      if (src) {
        execScript = `${execScript}\n//# sourceURL=${src}\n`;
      }
      // eslint-disable-next-line no-new-func
      const code = new Function('window', execScript).bind(this.sandbox);
      // run code with sandbox
      code(this.sandbox);
    } catch (error) {
      console.error(`error occurs when execute script in sandbox: ${error}`);
      throw error;
    }
  }

  runFinal() {
    if (this.sandbox) {
      this._pluginSystem.runFinal(this.sandbox, this.lifecycle);
    }

    if (!this._container) {
      return;
    }

    const {[TY_SUB_UNMOUNT_CALLBACK]: unmount, [TY_SUB_MOUNT_CALLBACK]: mount} = (this.sandbox as any) || {};

    if (mount && unmount) {
      mount?.({container: this._container, ...this._initialProps || {}});
      this._frameWorkUnmount = () => {
        unmount({container: this._container});
      };
    }
  }

  clear() {
    this._pluginSystem.clear();

    if (this._frameWorkUnmount) {
      this._frameWorkUnmount?.({container: this._container});
    }
    // remove event listeners
    Object.keys(this.eventListeners).forEach((eventName) => {
      (this.eventListeners[eventName] || []).forEach((listener: any) => {
        window.removeEventListener(eventName, listener);
      });
    });
    // clear timeout
    this.timeoutIds.forEach((id) => window.clearTimeout(id));
    this.intervalIds.forEach((id) => window.clearInterval(id));

    const list = Object.keys(this._needToClear);
    Log.info('清除全局污染数据 ===>', list);
    list.forEach((key) => {
      if (this.originalValues.hasOwnProperty(key)) {
        window[key] = this.originalValues[key];
      } else {
        Reflect.deleteProperty(window, key);
      }
    });

    for (const unsub of this.sandbox?.[TY_STORE_CACHE_LIST_VAR] || []) {
      Log.info('清除未卸载的监听事件 ===>', unsub);
      unsub?.unsubscribe?.();
    }

    this.unlisten();

    this._unmounted = true;
    Log.info('退出沙箱');
  }

  dispatchPathChange(pathname: string) {
    const {TY_SUB_PATH_CHANGE_CALLBACK: onPathChange} = (this.sandbox as any) || {};
    if (onPathChange) {
      onPathChange(pathname);
    }
  }
}
