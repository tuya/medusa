import {topWindow} from '../common';

type FunctionCall = (url: string) => boolean | void

class BrowserHistory {
  private _callbacks: FunctionCall[] = []

  private _url: string | undefined

  dispatch(url: string) {
    this._url = url;
    for (const callback of this._callbacks) {
      callback.apply(null, [url]);
    }
  }

  listen(listener: FunctionCall) {
    this._callbacks.push(listener);

    return () => {
      this.unlisten(listener);
    };
  }

  unlisten(listener: FunctionCall) {
    this._callbacks = this._callbacks.filter((t) => t !== listener);
  }

  get current() {
    return this._url;
  }
}

if (!topWindow.__tyHistory) {
  topWindow.__tyHistory = new BrowserHistory;
}


const emitter = topWindow.__tyHistory as BrowserHistory;

export default emitter;


