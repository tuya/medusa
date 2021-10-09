import {topWindow} from '../common';
import Layer from '../utils/path';
import router from '../packages/router-system';
import {isPrefixUrl, removePrefix} from '../utils/url';
import {appHistory} from '../client';

export const listenNativeEvents = (
    proxyWindow: Window,
    eventListeners: Record<string, any>,
    timeoutIds: number[],
    intervalIds: number[]
) => {
  const originalWindow = topWindow;

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  const originalSetInerval = window.setInterval;
  const originalSetTimeout = window.setTimeout;

  proxyWindow.addEventListener = (...args: any[]) => {
    eventListeners[args[0]] = eventListeners[args[0]] || [];
    eventListeners[args[0]].push(args[1]);
    return originalAddEventListener.apply(originalWindow, args as any);
  };

  proxyWindow.removeEventListener = ( ...args: any[]) => {
    const events = (eventListeners[args[0]] || []) as Array<any>;
    if (events.includes(args[1])) {
      events.splice(events.indexOf(args[1]), 1);
    }
    return originalRemoveEventListener.apply(originalWindow, args as any);
  };

  proxyWindow.setTimeout = (...args) => {
    const timerId = originalSetTimeout(...args);
    timeoutIds.push(timerId);
    return timerId;
  };
  proxyWindow.setInterval = (...args) => {
    const intervalId = originalSetInerval(...args);
    intervalIds.push(intervalId);
    return intervalId;
  };
};


export const listenRoutes = (path?: string, basename?: string, isNext?: boolean, sandbox?: any) => {
  if (path) {
    const regPath = new Layer(path);
    return router.listen((method, url, as) => {
      regPath.match(as);
      if (!regPath.isMatched) {
        return;
      }
      if (isNext && sandbox?.next && sandbox?.next.router) {
        /**
         * 如果在其它项目内调用，但匹配到了这个项目，需把basename移除
         */
        if (url === as && basename && basename !== '/' && isPrefixUrl(basename, url)) {
          url = removePrefix(basename, url);
        }
        if (method === 'replaceState') {
          sandbox.next.router.replace(url, as);
        } else {
          sandbox.next.router.push(url, as);
        }
        router.broadcast();
        return true;
      }

      if (method === 'replaceState') {
        appHistory.replace(as);
      } else {
        appHistory.push(as);
      }
      router.broadcast();
      return true;
    });
  }
};

