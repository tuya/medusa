import {IBasePlugin} from './base';
import {topWindow} from '../../common';
import {headProxy} from './proxy_document';
import {isWindowFunction} from '../../utils/proxys/fn';
import {EventCenterForMicroApp} from '../../plugins/jd-micro/events';

const proxyDocument = (doc: HTMLDocument, sandbox: Window, container: HTMLElement) => {
  const proxy = new Proxy(doc, {
    get(target, p: string) {
      const value = target[p];
      if (['head', 'body'].includes(p)) {
        const ele = container.querySelector(`micro-app-${p}`);
        if (ele) {
          return headProxy(ele as HTMLHeadElement, sandbox);
        }
        return null;
      }
      if (p === 'querySelector') {
        return (str: string) => {
          if (['head', 'body'].includes(str)) {
            return container.querySelector(`micro-app-${str}`);
          }
          if ('html' === str) {
            return container;
          } else {
            return container.querySelector(str);
          }
        };
      }
      if (p === 'querySelectorAll') {
        return (str: string) => {
          if (['head', 'body'].includes(str)) {
            return container.querySelectorAll(`micro-app-${str}`);
          }
          if ('html' === str) {
            return container;
          } else {
            return container.querySelectorAll(str);
          }
        };
      }
      if (p === 'getElementById') {
        return (str: string) => container.querySelector(`#${str}`);
      }
      if (p === 'getElementsByClassName') {
        return (str: string) => container.querySelectorAll(`.${str}`);
      }
      if (p === 'getElementsByTagName') {
        return (str: string) => container.querySelectorAll(str);
      }
      if (p === 'getElementsByName') {
        return (str: string) => container.querySelectorAll(`[name=${str}]`);
      }
      if (p === 'documentElement') {
        return container.firstElementChild;
      }
      if (p === 'document') {
        return proxy;
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


export default class ZoePlugin implements IBasePlugin {
  public assetPublicPath?: string

  public basename?: string

  public name: string

  public container: HTMLElement

  constructor(name: string, container: HTMLElement, assetPublicPath?: string, basename?: string,) {
    this.name = name;
    this.container = container;
    this.assetPublicPath = assetPublicPath;
    this.basename = basename;
  }

  init(proxyWindow: Window) {
    proxyWindow['__MICRO_APP_BASE_URL__'] = this.basename;
    proxyWindow['__MICRO_APP_PUBLIC_PATH__'] = this.assetPublicPath;
    proxyWindow['__MICRO_APP_NAME__'] = this.name;
    proxyWindow['__MICRO_APP_ENVIRONMENT__'] = true;
    proxyWindow['microApp'] = new EventCenterForMicroApp(this.name);
    proxyWindow['rawWindow'] = topWindow;
    proxyWindow['rawDocument'] = topWindow.document;

    Reflect.set(proxyWindow, 'document', null);
  }

  clear(): void {
  }

  runFinal(): void {
  }

  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (p === 'document') {
      const value = Reflect.get(originWindow, p);
      return {
        value: proxyDocument(value, sandbox, this.container)
      };
    }
  }

  proxySet(target: any, p: PropertyKey, value: any, sandbox: Window, originWindow: Window): boolean {
    return false;
  }
}
