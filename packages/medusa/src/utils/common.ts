export function defer(fn: Function, ...args: any[]): void {
  Promise.resolve().then(fn.bind(null, ...args));
}
