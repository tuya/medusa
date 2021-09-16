import Sandbox from '../../sandbox';

export interface CreateAppParam {

  isPrefetch: boolean
  name: string
  url: string
  container: HTMLElement | ShadowRoot | null
  baseurl:string
  sandBox: Sandbox | null
  idList: string[];

  status: any
  mount: any
  onerror: any

  getAppStatus: () => string
  unmount: (f: boolean) => void
}

export const appInstanceMap = new Map<string, CreateAppParam>();
