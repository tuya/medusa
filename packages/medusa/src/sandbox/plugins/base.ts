export interface IBasePlugin {

  init(proxyWindow: Window): void

  runFinal(sandbox: Window, lifecycle?: any): void

  proxySet(target: any, p: PropertyKey, value: any, sandbox: Window, originWindow: Window): boolean

  proxyGet(target: any, p: PropertyKey, sandbox: Window, originWindow: Window): {value: any} | undefined

  clear(): void

}

