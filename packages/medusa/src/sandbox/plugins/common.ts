import {IBasePlugin} from './base';
import {proxyDocument} from './proxy_document';

export default class DocumentPlugin implements IBasePlugin {
  private _excludeAssetFilter?: (assetUrl: string) => boolean
  public assetPublicPath?: string

  constructor(options: {
    props?: Record<string, any>
    excludeAssetFilter?: (assetUrl: string) => boolean
    assetPublicPath?: string,

  }) {
    const {excludeAssetFilter, assetPublicPath} = options;
    this.assetPublicPath = assetPublicPath;
    this._excludeAssetFilter = excludeAssetFilter;
  }

  clear(): void {
  }
  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    if (p === 'document') {
      const value = Reflect.get(originWindow, p);
      return {
        value: proxyDocument({
          doc: value,
          excludeAssetFilter: this._excludeAssetFilter,
          assetPublicPath: this.assetPublicPath,
          sandbox: sandbox,
        })
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
