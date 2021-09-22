import Url from 'url-parse';

export const parseUrl = (url: string) => {
  const inst = new Url(url);
  return {
    pathname: inst.pathname,
    query: inst.query as any,
    hash: inst.hash,
  };
};

export const urlJoin = (list: string[], endsWithSlash?: boolean) => {
  let str = list.map((t) => t.replace(/^[\\/]+|[\\/]+$/g, '')).filter((t) => !!t).join('/');
  str = `${str}${endsWithSlash? '/' : ''}`;
  if (!str.startsWith('/')) {
    str = '/' + str;
  }
  return str;
};

export const parseBaseName = (path?: string, passName?: string, params?: Record<string, any>) => {
  if (!path) {
    return '/';
  }
  let basename = path.substring(0, path.lastIndexOf('/')) || '/';
  if (passName) {
    if (passName.includes('{') && params) {
      basename = passName;
      for (const k in params) {
        basename = basename.replace(`{${k}}`, params[k] || '');
      }
    } else {
      basename = passName;
    }
  }
  return basename;
};


export const fixAppName = (appname?: string) => {
  return appname?.replace(/-/g, '_');
};

export const isPrefixUrl = (prefix?: string, url?: string) => {
  if (!url || !prefix) {
    return false;
  }
  if (url !== '/' && url.endsWith('/')) {
    url = url.substr(0, url.length - 1);
  }
  if (prefix !== '/' && prefix.endsWith('/')) {
    prefix = prefix.substr(0, prefix.length - 1);
  }
  return url.indexOf(prefix) === 0;
};

export const removePrefix = (prefix: string, url: string) => {
  if (!url || !prefix) {
    return url;
  }
  if (url !== '/' && url.endsWith('/')) {
    url = url.substr(0, url.length - 1);
  }
  if (prefix !== '/' && prefix.endsWith('/')) {
    prefix = prefix.substr(0, prefix.length - 1);
  }
  let path = url.replace(prefix, '');
  if (!path) {
    path = '/';
  }
  return path;
};

