/**
 * 此文件的内容和next的实现方式息息相关, 如果next.js的版本发生更新，一定得测试一下。
 */

import {IBasePlugin} from './base';
import Log from '../../utils/log';
import {topWindow} from '../../common';
import {headProxy} from './proxy_document';
import {NEXT_HOSTED_VALUES} from '../globals';
import {isWindowFunction} from '../../utils/proxys/fn';

class HookHistory {
  get state() {
    const rstate = topWindow.history.state;
    if (typeof rstate === 'object') {
      return rstate?._next || rstate;
    }
    return rstate;
  }

  get scrollRestoration() {
    return topWindow.history.scrollRestoration;
  }

  set scrollRestoration(v: any) {
    topWindow.history.scrollRestoration = v;
  }

  get length() {
    return topWindow.history.length;
  }

  formatState(data: any) {
    if (data && typeof data === 'object' && data.as) {
      const rstate = topWindow.history.state;
      return {
        ...data,
        _next: data,
        url: rstate?.url,
      };
    }
    return data;
  }

  back(): void {
    topWindow.history.back();
  }
  forward(): void {
    topWindow.history.forward();
  }
  go(delta?: number): void {
    topWindow.history.go(delta);
  }
  replaceState(data: any, unused: string, url?: string | URL): void {
    topWindow.history.replaceState(this.formatState(data), unused, url as any);
  }
  pushState(data: any, unused: string, url?: string | URL): void {
    topWindow.history.pushState(this.formatState(data), unused, url as any);
  }
}

const proxyDocument = (
    op: {
    doc: Document,
    sandbox: Window,
    appId?: string,
    excludeAssetFilter?: (assetUrl: string) => boolean
    assetPublicPath?: string
    container?: HTMLElement
  }
) => {
  const {doc, sandbox, appId, excludeAssetFilter, assetPublicPath, container} = op;
  const proxy = new Proxy(doc, {
    get(target, p: string) {
      const value = target[p];
      if (['head', 'body'].includes(p)) {
        return headProxy({
          head: value,
          sandbox,
          injection: (head, str) => {
            if (!appId) {
              return;
            }
            if (str === 'insertBefore') {
              return (node: HTMLElement, anchor: HTMLElement) => {
                if (node?.getAttribute?.('data-ncss-href')) {
                  node.setAttribute(`${appId}-data-ncss-href`, 'true');
                }
                Log.info('nextjs insertBefore rewrite!', node, anchor);
                head.insertBefore(node, anchor);
              };
            }
          },
          excludeAssetFilter,
          assetPublicPath
        });
      }
      if (p === 'querySelectorAll') {
        return (selectors: any) => {
          if (selectors == 'style[data-ncss-href]') {
            Log.info('nextjs querySelectorAll rewrite!', selectors);
            return topWindow.document.querySelectorAll(`style[${appId}-data-ncss-href]`);
          }
          return topWindow.document.querySelectorAll(selectors);
        };
      }
      if (p === 'getElementById') {
        return (elementId: string) => {
          if (elementId === '__NEXT_DATA__') {
            const ele = document.createElement('script');
            ele.textContent = JSON.stringify(sandbox['__NEXT_DATA__'] || {});
            return ele;
          }
          if (elementId === '__next') {
            return container || topWindow.document.getElementById(elementId);
          }
          return topWindow.document.getElementById(elementId);
        };
      }
      if (isWindowFunction(value)) {
        return value.bind(doc);
      }
      return value;
    },
    set(target, p, v) {
      target[p] = v;
      return true;
    }
  });
  return proxy;
};


export default class NextPlugin implements IBasePlugin {
  public hostedValues = new Map<PropertyKey, any>()

  private routerPrefix?: string

  private nextVersion?: number

  public container?: HTMLElement

  public appId?: string

  private _hookHistory = new HookHistory

  private _excludeAssetFilter?: (assetUrl: string) => boolean

  private _assetPublicPath?: string

  constructor(options: {
    appId?: string,
    container?: HTMLElement,
    basename?: string,
    nextVersion?: number,
    excludeAssetFilter?: (assetUrl: string) => boolean
    assetPublicPath?: string
  }) {
    const {appId, container, basename, nextVersion, excludeAssetFilter, assetPublicPath} = options;
    this.routerPrefix = basename;
    this.container = container;
    this.appId = appId;
    if (this.routerPrefix === '/') {
      this.routerPrefix = undefined;
    }
    this.nextVersion = nextVersion;
    this._excludeAssetFilter = excludeAssetFilter;
    this._assetPublicPath = assetPublicPath;
  }

  clear(): void {
    if (!this.appId) {
      return;
    }
    const links = topWindow.document.querySelectorAll(`style[${this.appId}-data-ncss-href]`);
    links.forEach((item) => {
      Log.info('remove nextjs dynamic style', item);
      item.remove();
    });
  }

  runFinal(): void {
  }

  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (NEXT_HOSTED_VALUES.includes(p as string)) {
      if (p === '__NEXT_DATA__' && this.nextVersion !== 1) {
        const __NEXT_DATA__ = this.hostedValues.get(p);
        if (__NEXT_DATA__ && this.routerPrefix) {
          if (typeof __NEXT_DATA__.runtimeConfig === 'object') {
            __NEXT_DATA__.runtimeConfig.routerPrefix = this.routerPrefix;
          }
          if (typeof __NEXT_DATA__.rctxSync === 'object') {
            __NEXT_DATA__.rctxSync.routerPrefix = this.routerPrefix;
          }
          this.hostedValues.set(p, __NEXT_DATA__);
          this.routerPrefix = undefined;
        }
      }
      return {
        value: this.hostedValues.get(p)
      };
    }
    if (p === 'document') {
      const value = Reflect.get(originWindow, p);
      return {
        value: proxyDocument({
          doc: value,
          sandbox,
          appId: this.appId,
          excludeAssetFilter: this._excludeAssetFilter,
          assetPublicPath: this._assetPublicPath,
          container: this.container,
        })
      };
    }

    if (p === 'history') {
      const hackedEnable = Reflect.get(target, '__history__hacked__');
      return hackedEnable ? {
        value: this._hookHistory
      } : undefined;
    }
    /**
     * next中默认的webpack 变量
     */
    if (p === 'webpackJsonp_N_E' || p === 'webpackHotUpdate_N_E') {
      return {
        value: Reflect.get(target, p)
      };
    }
  }

  proxySet(target: any, p: PropertyKey, value: any, sandbox: Window, originWindow: Window): boolean {
    if (NEXT_HOSTED_VALUES.includes(p as string)) {
      Log.info('正在注册NEXT变量', p, value);
      this.hostedValues.set(p, value);
      Reflect.set(target, p, value);
      return true;
    }
    return false;
  }

  public init(proxyWindow: Window) {
    Reflect.set(proxyWindow, 'document', null);
    Reflect.set(proxyWindow, 'history', null);
    NEXT_HOSTED_VALUES.forEach((k) => {
      Reflect.set(proxyWindow, k, undefined);
    });
  }
}
