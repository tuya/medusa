
export interface AppConfig {
  name: string
}

export interface LifecycleProps {
  container: HTMLElement | string;
  customProps?: object;
}

export interface StartConfiguration {
  shouldAssetsRemove?: (
    assetUrl?: string,
    element?: HTMLElement | HTMLLinkElement | HTMLStyleElement | HTMLScriptElement,
  ) => boolean;
  onRouteChange?: (
    url: string,
    pathname: string,
    query: object,
    hash?: string,
    // type?: RouteType | 'init' | 'popstate' | 'hashchange',
  ) => void;
  onAppEnter?: (appConfig: AppConfig) => void;
  onAppLeave?: (appConfig: AppConfig) => void;
  onLoadingApp?: (appConfig: AppConfig) => void;
  onFinishLoading?: (appConfig: AppConfig) => void;
  onError?: (err: Error) => void;
  onActiveApps?: (appConfigs: AppConfig[]) => void;
  // reroute?: (url: string, type: RouteType | 'init' | 'popstate'| 'hashchange') => void;
  // fetch?: Fetch;
  // prefetch?: Prefetch;
}

export type MicroApp =
  AppConfig
  & ModuleLifeCycle
  & { configuration?: StartConfiguration };

export interface ModuleLifeCycle {
    mount?: (props: LifecycleProps) => Promise<void> | void;
    unmount?: (props: LifecycleProps) => Promise<void> | void;
    update?: (props: LifecycleProps) => Promise<void> | void;
    bootstrap?: (props: LifecycleProps) => Promise<void> | void;
  }
