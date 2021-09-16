import {parseAssets} from '../../utils/assets';
import {defer} from '../../utils/common';
import Sandbox from '../../sandbox';
import dispatchLifecyclesEvent, {lifeCycles} from './lifecycle';
import {getCleanHtml} from '../../html-parse/utils';
import {appInstanceMap} from './cache';

// micro app instances

export function getEffectivePath(url: string): string {
  const {origin, pathname} = new URL(url);
  if (/\.(\w+)$/.test(pathname)) {
    const fullPath = `${origin}${pathname}`;
    const pathArr = fullPath.split('/');
    pathArr.pop();
    return pathArr.join('/') + '/';
  }

  return `${origin}${pathname}/`.replace(/\/\/$/, '/');
}

export enum appStatus {
  NOT_LOADED = 'NOT_LOADED',
  LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE',
  LOAD_SOURCE_FINISHED = 'LOAD_SOURCE_FINISHED',
  LOAD_SOURCE_ERROR = 'LOAD_SOURCE_ERROR',
  MOUNTING = 'MOUNTING',
  MOUNTED = 'MOUNTED',
  UNMOUNT = 'UNMOUNT',
}

// params of CreateApp
export interface CreateAppParam {
  name: string
  url: string
  baseurl?: string
  container?: HTMLElement | ShadowRoot
}

export default class CreateApp {
  private status: string = appStatus.NOT_LOADED
  isPrefetch = false
  name: string
  url: string
  container: HTMLElement | ShadowRoot | null = null
  baseurl = ''
  sandBox: Sandbox | null = null
  idList: string[] = [];

  constructor({name, url, container, baseurl}: CreateAppParam) {
    this.container = container ?? null;
    this.baseurl = baseurl ?? '';
    // optional during init👆
    this.name = name;
    this.url = url;
    this.mount().catch((err) => {
      this.onerror(err);
    });
  }

  // Load resources
  async mount() {
    // this.status = appStatus.LOADING_SOURCE_CODE;
    const {execScripts, getExternalStyleSheets, template} = await parseAssets({html: this.url});
    const styleContentList = await getExternalStyleSheets?.() || [];

    dispatchLifecyclesEvent(
      this.container as HTMLElement,
      this.name,
      lifeCycles.BEFOREMOUNT,
    );

    const fragment = document.createDocumentFragment();
    const headElement = document.createElement('micro-app-head');
    const bodyElement = document.createElement('micro-app-body');

    const body = getCleanHtml(template || '').body;

    bodyElement.innerHTML = body.innerHTML;

    styleContentList.forEach(((str) => {
      const id = `TUYA_INLINE_STYLE_${Math.random().toString(16).substr(2)}`;
      this.idList.push(id);
      const element = document.createElement('style');
      element.id = id;
      element.innerHTML = str;
      headElement.appendChild(element);
    }));
    fragment.appendChild(headElement);
    fragment.appendChild(bodyElement);

    this.container?.appendChild(fragment);

    this.sandBox = new Sandbox({
      container: this.container as HTMLElement,
      path: this.baseurl,
      framework: 'zoe',
      assetPublicPath: getEffectivePath(this.url),
      appId: this.name,
      basename: this.baseurl,
    });

    this.sandBox.init();

    execScripts?.(this.sandBox);

    if (this.status !== appStatus.UNMOUNT) {
      this.status = appStatus.MOUNTED;
      defer(() => {
        if (this.status !== appStatus.UNMOUNT) {
          dispatchLifecyclesEvent(
            this.container as HTMLElement,
            this.name,
            lifeCycles.MOUNTED,
          );
        }
      });
    }
  }

  unmount(destory: boolean): void {
    if (this.status === appStatus.LOAD_SOURCE_ERROR) {
      destory = true;
    }
    this.status = appStatus.UNMOUNT;
    dispatchLifecyclesEvent(
      this.container as HTMLElement,
      this.name,
      lifeCycles.UNMOUNT,
    );
    this.sandBox?.clear();
    this.container = null;
    if (destory) {
      appInstanceMap.delete(this.name);
    }
  }


  /**
   * app rendering error
   * @param e Error
   */
  onerror(e: Error): void {
    if (this.status !== appStatus.UNMOUNT) {
      dispatchLifecyclesEvent(
        this.container as HTMLElement,
        this.name,
        lifeCycles.ERROR,
        e,
      );
    }
  }

  // get app status
  getAppStatus(): string {
    return this.status;
  }
}
