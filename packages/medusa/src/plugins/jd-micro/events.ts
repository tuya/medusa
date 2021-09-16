import {EventEmitter} from 'eventemitter3';
import Log from '../../utils/log';
import {appInstanceMap} from './cache';


function formatEventName(appName: string, fromBaseApp: boolean): string {
  if (typeof appName !== 'string' || !appName) return '';
  return fromBaseApp ? `__from_base_app_${appName}__` : `__from_micro_app_${appName}__`;
}

class StoreCenter {
  private _emitter = new EventEmitter;

  private _cache = new Map<PropertyKey, any>()

  on(eventName: string, cb: (...args) => void, autoTrigger?: boolean) {
    this._emitter.on(eventName, cb);
    if (autoTrigger && this._cache.has(eventName)) {
      return cb(this._cache.get(eventName));
    }
  }

  off(name: string, f?: (...args) => void) {
    if (f) {
      this._emitter.off(name, f);
    } else {
      this._emitter.removeAllListeners(name);
    }
  }

  emit(name: string, data: Record<PropertyKey, any>) {
    this._emitter.emit(name, data);
    this._cache.set(name, data);
  }

  getData(name: string) {
    return this._cache.get(name);
  }

  dispatch(name: string, data: Record<PropertyKey, unknown>): void {
    if (toString.call(data) !== '[object Object]') {
      return Log.error('event-center: data must be object');
    }
    this.emit(name, data);
  }
}

const eventCenter = new StoreCenter();


class EventCenterForGlobal {
  /**
   * add listener of global data
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addGlobalDataListener(cb: (...args) => void, autoTrigger?: boolean): void {
    eventCenter.on('global', cb, autoTrigger);
  }

  /**
   * remove listener of global data
   * @param cb listener
   */
  removeGlobalDataListener(cb: (...args) => void): void {
    if (typeof cb === 'function') {
      eventCenter.off('global', cb);
    }
  }

  /**
   * dispatch global data
   * @param data data
   */
  setGlobalData(data: Record<PropertyKey, unknown>): void {
    eventCenter.dispatch('global', data);
  }

  /**
   * clear all listener of global data
   */
  clearGlobalDataListener(): void {
    eventCenter.off('global');
  }
}

export class EventCenterForBaseApp extends EventCenterForGlobal {
  /**
   * add listener
   * @param appName app.name
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addDataListener(appName: string, cb: (...args: any[]) => void, autoTrigger?: boolean): void {
    eventCenter.on(formatEventName(appName, false), cb, autoTrigger);
  }

  /**
   * remove listener
   * @param appName app.name
   * @param cb listener
   */
  removeDataListener(appName: string, cb: (...args) => void): void {
    if (typeof cb === 'function') {
      eventCenter.off(formatEventName(appName, false), cb);
    }
  }

  /**
   * get data from micro app or base app
   * @param appName app.name
   * @param fromBaseApp whether get data from base app, default is false
   */
  getData(appName: string, fromBaseApp = false): Record<PropertyKey, unknown> | null {
    return eventCenter.getData(formatEventName(appName, fromBaseApp));
  }

  /**
   * Dispatch data to the specified micro app
   * @param appName app.name
   * @param data data
   */
  setData(appName: string, data: Record<PropertyKey, unknown>): void {
    eventCenter.emit(formatEventName(appName, true), data);
  }

  /**
   * clear all listener for specified micro app
   * @param appName app.name
   */
  clearDataListener(appName: string): void {
    eventCenter.off(formatEventName(appName, false));
  }
}


export class EventCenterForMicroApp extends EventCenterForGlobal {
  appName: string
  constructor(appName: string) {
    super();
    this.appName = appName;
  }

  /**
   * add listener, monitor the data sent by the base app
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addDataListener(cb: (...args) => void, autoTrigger?: boolean): void {
    eventCenter.on(formatEventName(this.appName, true), cb, autoTrigger);
  }

  /**
   * remove listener
   * @param cb listener
   */
  removeDataListener(cb: (...args) => void): void {
    if (typeof cb === 'function') {
      eventCenter.off(formatEventName(this.appName, true), cb);
    }
  }

  /**
   * get data from base app
   */
  getData(): Record<PropertyKey, unknown> | null {
    return eventCenter.getData(formatEventName(this.appName, true));
  }

  /**
   * dispatch data to base app
   * @param data data
   */
  dispatch(data: Record<PropertyKey, unknown>): void {
    eventCenter.dispatch(formatEventName(this.appName, false), data);

    const app = appInstanceMap.get(this.appName);
    if (app?.container && toString.call(data) === '[object Object]') {
      const event = new CustomEvent('datachange', {
        detail: {
          data,
        }
      });

      let element = app.container;
      if (element instanceof ShadowRoot) {
        element = element.host as HTMLElement;
      }
      element.dispatchEvent(event);
    }
  }

  /**
   * clear all listeners
   */
  clearDataListener(): void {
    eventCenter.off(formatEventName(this.appName, true));
  }
}
