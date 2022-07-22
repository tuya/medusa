import {IBasePlugin} from './base';
import {proxyDocument} from './proxy_document';

export default class DocumentPlugin implements IBasePlugin {
  private _excludeAssetFilter?: (assetUrl: string) => boolean

  constructor(options: {
    props?: Record<string, any>
    excludeAssetFilter?: (assetUrl: string) => boolean
  }) {
    const {excludeAssetFilter} = options;
    this._excludeAssetFilter = excludeAssetFilter;
  }

  clear(): void {
  }
  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (p === 'document') {
      const value = Reflect.get(originWindow, p);
      return {
        value: proxyDocument(value, sandbox, this._excludeAssetFilter)
      };
    }
  }
  runFinal(): void {
  }
  proxySet(): boolean {
    return false;
  }
  public init(proxyWindow: Window) {
    Reflect.set(proxyWindow, 'document', null);
  }
}
