export function defer(fn: Function, ...args: any[]): void {
  Promise.resolve().then(fn.bind(null, ...args));
}

export function getLocationOrigin() {
  const {protocol, hostname, port} = window.location;
  return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}

export function getURL() {
  const {href} = window.location;
  const origin = getLocationOrigin();
  return href.substring(origin.length);
}
