import {EventEmitter} from 'eventemitter3';
import Log from '../../utils/log';
import {defineElement} from './element';
import {EventCenterForBaseApp} from './events';

let gInst: JDMicroApp | null = null;

const tagName = 'micro-app';

class JDMicroApp extends EventCenterForBaseApp {
  private _emitter = new EventEmitter

  start() {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window?.customElements) {
      return Log.error('customElements is not supported in this environment');
    }

    defineElement(tagName);
  }

  static getInstance() {
    if (gInst) {
      return gInst;
    }
    return gInst = new JDMicroApp;
  }

  on(event: string, fn: (...args) => void) {
    this._emitter.on(event, fn);
    return () => {
      this._emitter.off(event, fn);
    };
  }

  off(event: string, fn: (...args) => void) {
    this._emitter.off(event, fn);
  }

  emit(event: string, data: any) {
    this._emitter.emit(event, data);
  }
}

export default JDMicroApp;
