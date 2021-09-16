import {isInMicroApp, topWindow, TY_SUB_APP_ID, TY_SUB_BASE_NAME, TY_SUB_UNMOUNT_CALLBACK, TY_SUB_MOUNT_CALLBACK, TY_SUB_PATH_CHANGE_CALLBACK} from '../common';

/**
 * 获取appId,由于此时正处于沙箱环境，所以可以通过从沙箱拿到主项目传给沙箱的ID
 */
const getAppId = (appId?: string) => {
  if (typeof window !== 'undefined') {
    return appId || (window as any)[TY_SUB_APP_ID] || topWindow?.tyMicroApp?.defaultAppId;
  }
};

/**
 * @deprecated
 */
export const enableNextDebug = (url?: string) => {
  // no use
};

export const startApp = (id: string) => {
  if (!topWindow.tyMicroApp) {
    return;
  }
  topWindow.tyMicroApp.apps = topWindow.tyMicroApp.apps || {};
  if (topWindow.tyMicroApp.apps[id]) {
    console.warn('you have already started an route with same app id');
  }
  topWindow.tyMicroApp.apps[id] = {};
};

export const stopApp = (id:string) => {
  if (!topWindow.tyMicroApp?.apps?.[id]) {
    return;
  }
  Reflect.deleteProperty(topWindow.tyMicroApp.apps, id);
};

const getTyApp = (appId:string) => {
  if (!topWindow.tyMicroApp?.apps?.[appId]) {
    return;
  }
  return topWindow.tyMicroApp.apps[appId];
};

const getAppInfo = (appId?:string) => {
  if (!topWindow.tyMicroApp?.apps) {
    throw new Error('Your application is not running in tuya-micro-app');
  }

  const appInfo = topWindow.tyMicroApp.apps[getAppId(appId)];
  return appInfo;
};

export const setMountedNode = (appId:string, domId?: string) => {
  const app = getTyApp(appId);
  if (!app) {
    return;
  }
  app.domId = domId;
};

/**
 * 主项目调用，在主项目设置子项目的basename
 */
export const setBasename = (appId:string, basename?:string) => {
  const app = getTyApp(appId);
  if (!app) {
    return;
  }
  app.basename = basename;
};

/**
 * 子项目调用，在子项目获取主项目设置的basename
 */
export const getBasename = (appId?:string): string => {
  if (!isInMicroApp() || typeof window === 'undefined' || topWindow === window) {
    return '/';
  }
  if (window[TY_SUB_BASE_NAME]) {
    return window[TY_SUB_BASE_NAME];
  }
  const appInfo = getAppInfo(appId);
  return appInfo?.basename || '/';
};

// export const set

/**
 * 子项目获取应该加载的dom节点，next子项目不用调用
 */
export const getMountedNode = (appId?:string) => {
  const appInfo = getAppInfo(appId);

  if (!appInfo?.domId) {
    console.error('Currently is no container!');
    return;
  }

  return document.getElementById(appInfo.domId);
};

/**
 * 子项目注册生命周期，手动控制挂载和销毁
 */
export const registerLifecycle = (lifecycle: {
  mount?: ({container: HTMLElement}) => void
  unmount?: ({container: HTMLElement}) => void
}) => {
  if (lifecycle.mount) {
    window[TY_SUB_MOUNT_CALLBACK] = lifecycle.mount;
  }
  if (lifecycle.unmount) {
    window[TY_SUB_UNMOUNT_CALLBACK] = lifecycle.unmount;
  }
  return () => {
    window[TY_SUB_MOUNT_CALLBACK] = undefined;
    window[TY_SUB_UNMOUNT_CALLBACK] = undefined;
  };
};

/**
 * 子项目注册路由变化回调，适用于一些菜单高亮或子项目使用自身路由的情况
 */
export const registerPathChange = (callback: (path: string) => void) => {
  window[TY_SUB_PATH_CHANGE_CALLBACK] = callback;
  return () => {
    window[TY_SUB_PATH_CHANGE_CALLBACK] = undefined;
  };
};
