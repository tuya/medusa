import {topWindow} from '../../common';
import Log from '../../utils/log';

export const ICESTARK_NAME_SPACE = 'ICESTARK';

export const setCache = (key: string, value: any) => {
  if (!(topWindow as any)[ICESTARK_NAME_SPACE]) {
    (window as any)[ICESTARK_NAME_SPACE] = {};
  }
  (window as any)[ICESTARK_NAME_SPACE][key] = value;
};

export const getCache = (key: string) => {
  return (window as any)[ICESTARK_NAME_SPACE]?.[key];
};

export const createIceStarkProxy = (initialData?: {
  root?: HTMLElement | string
  basename?: string
}) => {
  const proxyIceStark = initialData || {};

  const iceStarkProxy = new Proxy(proxyIceStark, {
    set(target, p: string, value): boolean {
      if (topWindow.ICESTARK) {
        topWindow.ICESTARK[p] = value;
      }
      target[p] = value;
      return true;
    },
    get(target, p: string) {
      if (p === 'library') {
        Log.info('icestark get library name', target[p]);
        return target[p];
      }
      if (['store', 'event'].includes(p)) {
        return topWindow.ICESTARK?.[p];
      }
      return target[p] || topWindow.ICESTARK?.[p];
    }
  });
  return iceStarkProxy;
};
