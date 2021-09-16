import EventEmitter from 'eventemitter3';

import {isInTopWindow, topWindow} from '../common';
import Log from '../utils/log';
import {urlJoin} from '../utils/url';
import {getBasename} from './app';

const eventname = '$medusa_router_event';

type HistoryMethod = 'pushState' | 'replaceState'

type FunctionCall = (method: HistoryMethod, url: string, as:string) => boolean | void


class RouterSystem extends EventEmitter {
  private _urlOption: {url: string, as: string} | null = null

  private _callbacks: FunctionCall[] = []

  private dispatch(method: HistoryMethod, url: string, as: string) {
    let flag = false;
    for (const callback of this._callbacks) {
      if (callback.apply(null, [method, url, as])) {
        flag = true;
        break;
      }
    }

    if (!flag) {
      Log.warn('当前路由没有被消费，请检查代码！！', url, as);
    }
  }

  listen(listener: FunctionCall) {
    /**
     * 如果涉及到子项目的子项目，这时候可能会有多个匹配项，这时候需从最底层开始，防止匹配遗漏。
     */
    this._callbacks = [listener, ...this._callbacks];

    return () => {
      this.unlisten(listener);
    };
  }

  unlisten(listener: FunctionCall) {
    this._callbacks = this._callbacks.filter((t) => t !== listener);
  }

  _buildRouteOption(url: string, as?: string, options = {autoBasename: true}) {
    if (options.autoBasename) {
      as = urlJoin([getBasename(), as || url]);
    }
    this._urlOption = {url, as: as || url};
    return {url, as: as || url};
  }

  push(url: string, as?: string, options = {autoBasename: true}) {
    const urlOption = this._buildRouteOption(url, as, options);
    this.dispatch('pushState', urlOption.url, urlOption.as);
  }

  replace(url: string, as?: string, options = {autoBasename: true}) {
    const urlOption = this._buildRouteOption(url, as, options);
    this.dispatch('replaceState', urlOption.url, urlOption.as);
  }

  broadcast() {
    if (this._urlOption) {
      this.emit(eventname, {...this._urlOption});
    }
  }

  onEvent(callback: (v: {url: string, as: string}) => void) {
    this.on(eventname, callback);
  }

  offEvent(callback: (v: {url: string, as: string}) => void) {
    this.off(eventname, callback);
  }

  getValue() {
    return this._urlOption;
  }

  initValue(v: {url: string, as: string}) {
    if (!this._urlOption) {
      this._urlOption = v;
    }
  }
}

if (!topWindow.__tyRouterSystem) {
  topWindow.__tyRouterSystem = new RouterSystem;
}


const emitter = topWindow.__tyRouterSystem as RouterSystem;

export default emitter;


