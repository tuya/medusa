export const QIANKUN_NAME_SPACE = '__POWERED_BY_QIANKUN__';

export const __INJECTED_PUBLIC_PATH_BY_QIANKUN__ = '__INJECTED_PUBLIC_PATH_BY_QIANKUN__';

export type OnGlobalStateChangeCallback = (state: Record<string, any>, prevState: Record<string, any>) => void;

function isFunction(value) {
  return typeof value === 'function';
}

export interface ILifecycle {
  mount: (props: {
    container: HTMLElement | string
    setGlobalState?: (state?: Record<string, any>) => void
    onGlobalStateChange?: (callback: OnGlobalStateChangeCallback, fireImmediately?: boolean) => void
    [key: string]: any
  }) => void
  unmount: (props: {container: HTMLElement | string}) => void
  bootstrap: () => void
}

export function validateExportLifecycle(exports: any): exports is ILifecycle {
  const {bootstrap, mount, unmount} = exports ?? {};
  return isFunction(bootstrap) && isFunction(mount) && isFunction(unmount);
}
