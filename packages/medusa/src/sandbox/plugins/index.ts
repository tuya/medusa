import {IBasePlugin} from './base';

export default class PluginSystem implements IBasePlugin {
  public plugins: IBasePlugin[] = [];

  init(proxyWindow: Window): void {
    this.plugins.forEach((p) => p.init(proxyWindow));
  }
  runFinal(sandbox: Window, lifecycle?: any): void {
    this.plugins.forEach((p) => p.runFinal(sandbox, lifecycle));
  }
  proxySet(target: any, p: PropertyKey, value: any, sandbox: Window, originWindow: Window): boolean {
    for (const plugin of this.plugins) {
      const res = plugin.proxySet(target, p, value, sandbox, originWindow);
      if (res) {
        return true;
      }
    }
    return false;
  }
  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window) {
    for (const plugin of this.plugins) {
      const res = plugin.proxyGet(target, p, sandbox, originWindow);
      if (res !== undefined) {
        return res;
      }
    }
    return undefined;
  }

  proxyHas(target: any, p: PropertyKey): boolean | undefined {
    for (const plugin of this.plugins) {
      const res = plugin.proxyHas?.(target, p);
      if (res !== undefined) {
        return res;
      }
    }
    return undefined;
  }

  clear(): void {
    this.plugins.forEach((p) => p.clear());
  }
}
