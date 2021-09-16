/**
 * 此文件的内容和next的实现方式息息相关, 如果next.js的版本发生更新，一定得测试一下。
 */

import {IBasePlugin} from './base';
import Log from '../../utils/log';
import {topWindow} from '../../common';
import {headProxy} from './proxy_document';
import {NEXT_HOSTED_VALUES} from '../globals';
import {isWindowFunction} from '../../utils/proxys/fn';

const proxyDocument = (doc: HTMLDocument, sandbox: Window, appId?: string) => {
  const proxy = new Proxy(doc, {
    get(target, p: string) {
      const value = target[p];
      if (['head', 'body'].includes(p)) {
        return headProxy(value, sandbox, (head, str) => {
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

  constructor(appId?: string, container?: HTMLElement, basename?: string, nextVersion?: number) {
    this.routerPrefix = basename;
    this.container = container;
    this.appId = appId;
    if (this.routerPrefix === '/') {
      this.routerPrefix = undefined;
    }
    this.nextVersion = nextVersion;
  }

  clear(): void {
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
        value: proxyDocument(value, sandbox, this.appId)
      };
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
    NEXT_HOSTED_VALUES.forEach((k) => {
      Reflect.set(proxyWindow, k, undefined);
    });
  }
}
