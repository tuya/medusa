import Log from '../../utils/log';
import {IBasePlugin} from './base';
import {fixAppName} from '../../utils/url';
import {topWindow} from '../../common';
import {__REACT_ERROR_OVERLAY_GLOBAL_HOOK__} from '../globals';


export default class WebpackPlugin implements IBasePlugin {
  public hotUpdateName?: string
  public webpackJsonpName?: string

  private originalValues = new Map<PropertyKey, any>()

  private needToClear = new Set<PropertyKey>()

  constructor(appId?: string) {
    if (appId) {
      this.hotUpdateName = `webpackJsonp_hotUpdateGlobal_${fixAppName(appId)}`;
      /**
       * 故意写的wepback，历史原因。淡定
       */
      this.webpackJsonpName = `wepbackJsonp_${fixAppName(appId)}`;
    }
    if (topWindow._babelPolyfill) {
      topWindow._babelPolyfill = false;
    }
  }

  public init(proxyWindow: Window) {
    if (this.webpackJsonpName) {
      const property = this.webpackJsonpName;
      Object.defineProperty(topWindow, property, {
        get: () => {
          Log.info('webpackJsonp call outside', property);
          return Reflect.get(proxyWindow, property);
        },
        set: (v) => {
          Log.info('webpackJsonp write outside', property);
          Reflect.set(proxyWindow, property, v);
        },
        configurable: true
      });
    }
  }

  runFinal(): void {
  }

  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (p === __REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
      return {
        value: Reflect.get(target, p)
      };
    }

    if (this.webpackJsonpName && p === this.webpackJsonpName) {
      return {
        value: Reflect.get(target, p)
      };
    }

    /**
     * 默认的webpack变量
     */
    if (p === 'webpackJsonp' || p === 'webpackChunkwebpack' || p === 'webpackHotUpdate' || p === 'webpackChunk_N_E' || p === 'webpackHotUpdate_N_E') {
      return {
        value: Reflect.get(target, p)
      };
    }
  }

  proxySet(target: any, p: PropertyKey, value: any, sandbox: Window, originWindow: Window): boolean {
    if (this.hotUpdateName && p === this.hotUpdateName) {
      if (originWindow.hasOwnProperty(p) && !this.originalValues.has(p)) {
        this.originalValues.set(p, Reflect.get(originWindow, p));
        Log.info('正在覆盖全局变量', p, value);
      }
      Reflect.set(originWindow, p, value);
      this.needToClear.add(p);
      Log.info('注册全局变量 ===>', p, value);
      return true;
    }

    if (typeof p === 'string' && p.includes(`${__REACT_ERROR_OVERLAY_GLOBAL_HOOK__}$`)) {
      Reflect.set(originWindow, p, value);
      Log.info(`注册${p}变量至全局`);
      this.needToClear.add(p);
      Reflect.set(target, p, value);
      return true;
    }

    // 如果全局没有就注册进全局，有也注册到全局，hot-reload 会用到，比如主项目是生产模式，子项目是开发模式（注意：这时候主项目hotreload失效，）
    if (__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ === p) {
      if (!originWindow.hasOwnProperty(p)) {
        Reflect.set(originWindow, p, value);
        Log.info('注册__REACT_ERROR_OVERLAY_GLOBAL_HOOK__变量至全局，你的主项目应该是非开发模式！ ===>', p, value);
        this.needToClear.add(p);
        Reflect.set(target, p, value);
        return true;
      }
      if (!this.originalValues.hasOwnProperty(p)) {
        this.originalValues.set(p, Reflect.get(originWindow, p));
      }
      Reflect.set(originWindow, p, value);
      this.needToClear.add(p);
      target[p] = value;
      /**
       * https://github.com/facebook/create-react-app/blob/master/packages/react-error-overlay/src/index.js
       */
      Log.warn('已经存在__REACT_ERROR_OVERLAY_GLOBAL_HOOK__，强制覆盖，请注意，此时主项目hot reload将失效，这是由react-error-overlay写法不规范造成的，暂无好的解决方案，需手动刷新。', p, value);
      return true;
    }

    return false;
  }

  public clear() {
    if (this.webpackJsonpName) {
      Reflect.deleteProperty(window, this.webpackJsonpName);
    }
    const list = Object.keys(this.needToClear);
    Log.info('清除Webpack全局污染数据 ===>', list);
    list.forEach((key) => {
      if (this.originalValues.hasOwnProperty(key)) {
        Reflect.set(window, key, this.originalValues[key]);
      } else {
        Reflect.deleteProperty(window, key);
      }
    });
  }
}
