import Log from '../../utils/log';
import {IBasePlugin} from './base';
import {topWindow} from '../../common';
import {proxyDocument} from './proxy_document';
import {dispatch, subscribe} from '../../packages/store';
import {createIceStarkProxy, ICESTARK_NAME_SPACE} from '../../plugins/ali/icestark';
import {
  ILifecycle,
  OnGlobalStateChangeCallback,
  QIANKUN_NAME_SPACE,
  validateExportLifecycle,
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__
} from '../../plugins/ali/qiankun';

export default class IceStarkPlugin implements IBasePlugin {
  public iceProxy: Record<string, any>

  private _container?: HTMLElement | string | undefined

  private _frameWorkUnmount: Function | undefined

  public lifecycle: ILifecycle | string | undefined

  public framework: 'qiankun' | 'icestark'

  public assetPublicPath?: string

  private _excludeAssetFilter?: (assetUrl: string) => boolean

  private _unSub?: {unsubscribe: () => void}

  private passProps?: Record<string, any>

  private _appId: string | undefined

  constructor(options: {
    framework: 'qiankun' | 'icestark',
    assetPublicPath?: string,
    container?: HTMLElement | string | undefined,
    basename?: string
    props?: Record<string, any>
    appId?: string
    excludeAssetFilter?: (assetUrl: string) => boolean
  }) {
    const {framework, assetPublicPath, container, basename, props, excludeAssetFilter, appId} = options;
    this.framework = framework;
    this.assetPublicPath = assetPublicPath;
    this._container = container;
    this.iceProxy = createIceStarkProxy({
      root: container,
      basename: basename
    });
    this.passProps = props;
    this._excludeAssetFilter = excludeAssetFilter;
    this._appId = appId;
  }

  init(proxyWindow: Window) {
    Reflect.set(proxyWindow, 'document', null);
    if (this.framework === 'qiankun') {
      proxyWindow[QIANKUN_NAME_SPACE] = true;
      proxyWindow[__INJECTED_PUBLIC_PATH_BY_QIANKUN__] = this.assetPublicPath;
    } else {
      topWindow[ICESTARK_NAME_SPACE] = topWindow[ICESTARK_NAME_SPACE] || {};
    }
  }

  proxyGet(_: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (p === ICESTARK_NAME_SPACE) {
      return {
        value: this.iceProxy
      };
    }
    if (p === 'document') {
      const value = Reflect.get(originWindow, p);
      return {
        value: proxyDocument(value, sandbox, this._excludeAssetFilter)
      };
    }
  }

  proxyHas(_: any, p: PropertyKey) {
    if (p === ICESTARK_NAME_SPACE) {
      return true;
    }
  }

  runFinal(sandbox: Window, cycle?: ILifecycle): void {
    if (!this._container) {
      return;
    }

    this.lifecycle = cycle;

    if (this.framework === 'qiankun' && this._container instanceof HTMLElement && this._container.parentElement) {
      this._container.id = this._container.id || 'root';
      this._container = this._container.parentElement;
    }

    const checkLifecycle = (container: HTMLElement | string, lifecycle: string | ILifecycle | undefined) => {
      if (lifecycle && validateExportLifecycle(lifecycle)) {
        Log.info('find umd lifecycle', lifecycle);
        lifecycle.mount?.({
          container,
          setGlobalState: (state) => {
            dispatch(state);
          },
          onGlobalStateChange: (callback) => {
            let prevState: any = {};
            this._unSub = subscribe((v) => {
              callback?.(v, prevState);
              prevState = v;
            });
          },
          ...this.passProps || {},
        });
        this._frameWorkUnmount = () => {
          lifecycle?.unmount({container});
        };
        return true;
      }
    };

    if (checkLifecycle(this._container, this.lifecycle)) {
      return;
    }

    if (this._appId && sandbox[this._appId] && checkLifecycle(this._container, sandbox[this._appId])) {
      this.lifecycle = sandbox[this._appId];
      return;
    }

    if (this.framework === 'icestark') {
      const libraryName = Reflect.get(sandbox, 'ICESTARK')?.library;
      if (libraryName) {
        const lifecycle = Reflect.get(sandbox, libraryName) as ILifecycle | undefined;
        lifecycle?.mount({
          container: this._container,
          ...this.passProps || {},
        });
        this._frameWorkUnmount = () => {
          lifecycle?.unmount({container: this._container!});
        };
        return;
      } else if (typeof this.lifecycle === 'string' && checkLifecycle(this._container, Reflect.get(sandbox, this.lifecycle))) {
        return;
      }
      Log.warn('you are in icestark microapp, but we can not find library, do you call setLibraryName?');
      return;
    }

    Log.warn('you are in qiankun microapp, but we can not find lifecycle, do you call setLifecycle?');
  }

  proxySet(): boolean {
    return false;
  }

  clear(): void {
    if (this._frameWorkUnmount) {
      this._frameWorkUnmount?.({container: this._container});
    }
    this._unSub?.unsubscribe();
  }
}
