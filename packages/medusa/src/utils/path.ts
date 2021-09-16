import {pathToRegexp, Key} from './path-to-regexp';

type MatchParams = {
  path: string
  isExact: boolean
  params: Record<string, any>
  values?: Array<any>
}

export default class Layer {
  private regexp?: RegExp

  private isStar = false
  private isRoot = false

  private path?:string

  private keys:Array<Key> = []

  private matchParams: MatchParams | undefined = undefined

  public get isMatched() {
    return !!this.matchParams;
  }

  public get result() {
    return this.matchParams;
  }

  constructor(path = '/') {
    if (path.endsWith('/*')) {
      path = path.replace('/*', '/(.*)');
    }
    this.regexp = pathToRegexp(path, this.keys);
    this.path = path;

    if (path === '*') {
      this.isStar = true;
    }
    if (path === '/') {
      this.isRoot = true;
    }
  }

  match(path:string, options?:{exact?: boolean}) {
    this.matchParams = undefined;
    if (options?.exact) {
      this.matchParams = this.path === path ? {path, isExact: true, params: {}} : undefined;
      return this.isMatched;
    }

    let match: RegExpExecArray | null | undefined;

    if (path != null) {
      // fast path non-ending match for / (any path matches)
      if (this.isRoot) {
        this.matchParams = {path, isExact: false, params: {}};
        return this.isMatched;
      }

      // fast path for * (everything matched in a param)
      if (this.isStar) {
        this.matchParams = {path, isExact: false, params: {}};
        return this.isMatched;
      }

      // match the path
      match = this.regexp?.exec(path);
    }

    if (!match) {
      this.matchParams = undefined;
      return this.isMatched;
    }

    const [url, ...values] = match;

    const isExact = path === url;

    this.matchParams = {
      path, // the path used to match
      isExact, // whether or not we matched exactly
      params: this.keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, {} as any),
      values: values.slice(0, this.keys.length)
    };
  }

  public formatUrl(url: string) {
    if (!url.includes('{') || !this.isMatched) {
      return url;
    }

    let str: string = url;

    for (const k in this.result?.params || {}) {
      str = str.replace(`{${k}}`, this.result?.params[k] || '');
    }
    return str;
  }
}
