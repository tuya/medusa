import {defer} from '../../utils/common';
import dispatchLifecyclesEvent, {lifeCycles} from './lifecycle';
import CreateApp, {appStatus} from './create_app';
import {appInstanceMap, CreateAppParam} from './cache';

export enum ObservedAttrName {
  NAME = 'name',
  URL = 'url',
}

interface IJDAppElement extends HTMLElement {
  name: string
  url: string
  isWating: boolean
}

export default class WrapperAppElement {
  element: IJDAppElement

  constructor(ele: IJDAppElement) {
    this.element = ele;
  }

  get name() {
    return this.element.name;
  }

  get url() {
    return this.element.url;
  }

  get isWating() {
    return this.element.isWating;
  }

  get shadowRoot() {
    return this.element.shadowRoot;
  }

  getAttribute(name) {
    return this.element.getAttribute(name);
  }

  set name(v) {
    this.element.name = v;
  }
  set url(v) {
    this.element.url = v;
  }
  set isWating(v) {
    this.element.isWating = v;
  }

  set innerHTML(v) {
    this.element.innerHTML = v;
  }

  connectedCallback() {
    defer(() => dispatchLifecyclesEvent(
        this.element,
        this.name,
        lifeCycles.CREATED,
    ));

    if (!this.name || !this.url) return;

    this.element.attachShadow({mode: 'open'});

    this.handleCreate();
  }

  disconnectedCallback(): void {
    this.handleUnmount();
  }

  attributeChangedCallback(attr: ObservedAttrName, _oldVal: string, newVal: string): void {
    if (this[attr] !== newVal) {
      if (attr === ObservedAttrName.URL && !this.url) {
        this.url = newVal;
      } else if (attr === ObservedAttrName.NAME && !this.name) {
        this.name = newVal;
      } else if (!this.isWating) {
        this.isWating = true;
        defer(this.handleAttributeUpdate.bind(this));
      }
    }
  }

  handleCreate() {
    const app = new CreateApp({
      name: this.name!,
      url: this.url!,
      container: this.element.shadowRoot ?? this.element,
      baseurl: this.getAttribute('baseurl') ?? '',
    });

    appInstanceMap.set(this.name, app as any);
  }

  handleAppMount(app: CreateAppParam): void {
    defer(() => app.mount());
  }

  handleUnmount(): void {
    const app = appInstanceMap.get(this.name!);
    if (app && app.getAppStatus() !== appStatus.UNMOUNT) app.unmount(true);
  }

  handleAttributeUpdate() {
    this.isWating = false;
    const attrName = this.getAttribute('name');
    const attrUrl = this.getAttribute('url') || '';
    const existApp = appInstanceMap.get(attrName!);

    if (attrName !== this.name || attrUrl !== this.url) {
      this.handleUnmount();
      this.name = attrName as string;
      this.url = attrUrl;
      (this.shadowRoot ?? this).innerHTML = '';
      /**
       * when existApp not undefined
       * if attrName and this.name are equal, existApp has been unmounted
       * if attrName and this.name are not equal, existApp is prefetch or unmounted
       */
      if (existApp && existApp.url === attrUrl) {
        // mount app
        this.handleAppMount(existApp);
      } else {
        this.handleCreate();
      }
    }
  }
}

const GlobalCache: Record<string, any> = {};

const generateFunction = new Function('window', 'WrapperAppElement', `
  with(window) {
    class JDAppElement extends HTMLElement {
      name = ''
      url = ''
      isWating = false

      constructor() {
        super()
        this.wrapper = new WrapperAppElement(this)
      }
    
      static get observedAttributes() {
        return ['name', 'url'];
      }
    
      connectedCallback() {
        this.wrapper.connectedCallback();
      }
    
      disconnectedCallback() {
        this.wrapper.disconnectedCallback()
      }
      attributeChangedCallback(attr, _oldVal, newVal) {
        this.wrapper.attributeChangedCallback(attr, _oldVal, newVal);
      }
    }
    window.JDAppElement = JDAppElement
  }
`);


export function defineElement(tagName: string): boolean {
  if (window.customElements.get(tagName)) {
    return false;
  }

  generateFunction(GlobalCache, WrapperAppElement);

  if (GlobalCache.JDAppElement) {
    window.customElements.define(tagName, GlobalCache.JDAppElement);
  }
  return true;
}
