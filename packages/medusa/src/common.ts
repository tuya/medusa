const findTopWindow = () => {
  if (typeof window === 'undefined') {
    return {};
  }
  return new Function('return window')();
  // let win:any = window;
  // while (win.__tyParentWindow) {
  //   win = win.__tyParentWindow;
  // }
  // return win;
};

export interface IMyWindow extends Window {
  ICESTARK?: Record<string, any>
  __REACT_ERROR_OVERLAY_GLOBAL_HOOK__?: any
  tyMicroApp?: {
    apps?: {[key:string]: {domId?:string, basename?: string}}
    defaultAppId: string
  }
  __tyParentWindow?: any
  __tyEventEmitter?: any
  __tyRouterSystem?: any
  __tyHistory?: any
  _babelPolyfill?: boolean
}

export const TY_SUB_APP_ID = 'MED_SUB_APP_ID';

export const TY_SUB_BASE_NAME = 'MED_SUB_BASE_NAME';

export const TY_SUB_PUBLIC_PATH = 'TY_SUB_PUBLIC_PATH';


export const TY_SUB_UNMOUNT_CALLBACK = 'TY_SUB_UNMOUNT_CALLBACK';

export const TY_SUB_MOUNT_CALLBACK = 'TY_SUB_MOUNT_CALLBACK';

export const TY_SUB_PATH_CHANGE_CALLBACK = 'MED_SUB_PATH_CHANGE_CALLBACK';

export const TY_APP_NAME_VAR = '_tyMicroApp';

export const HIJACK_EVENTS_NAME = /^(hashchange|popstate)$/i;

/**
 * eval('window')
 */
export const topWindow:IMyWindow = typeof window === 'undefined' ? {} : findTopWindow();

export const isInMicroApp = () => !!topWindow.tyMicroApp;

/**
 * 只在Router被使用时才有变量
 */
export const initApp = () => {
  topWindow.tyMicroApp = topWindow.tyMicroApp || {defaultAppId: Math.random().toString(16).substr(2)};
};


export const isInTopWindow = () => {
  return topWindow === window;
};
