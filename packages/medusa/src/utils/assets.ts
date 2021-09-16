// import importHtml from '../import-html-entry';
import Layer from './path';
import {execNextScripts} from '../plugins/next/assets';
import {importHtml} from '../html-parse';
import {execCommonScript} from '../plugins/common/assets';
import {getStyleContents} from '../html-parse/utils';
import Sandbox from '../sandbox';

const parseManifest = async (manifest: string, jsList: string[], cssList: string[]) => {
  const res = await fetch(manifest);
  const jsonList = await res.json();
  const dataType = Object.prototype.toString.call(jsonList);
  if (dataType === '[object Array]') {
    (jsonList as Array<string>).forEach((str)=>{
      const list = str.split('.');
      const ext = list[list.length-1];
      if (ext === 'css') {
        cssList.push(str);
      } else if (ext === 'js') {
        jsList.push(str);
      }
    });
  } else if (dataType === '[object Object]') {
    for (const str in jsonList) {
      const list = str.split('.');
      const ext = list[list.length-1];
      if (ext === 'css') {
        cssList.push(jsonList[str]);
      } else if (ext === 'js') {
        jsList.push(jsonList[str]);
      }
    }
  }
  return {jsList, cssList};
};

export const parseAssets = async (options:{
  assets?: {
    js?: Array<string>
    css?: Array<string>
  },
  manifest?: string
  html?:string
  next?: string
  credentials?: boolean
  query?:string
}, layer?: Layer) => {
  const jsList:Array<string> = [];
  const cssList:Array<string> = [];

  if (options.manifest) {
    await parseManifest(options.manifest, jsList, cssList);
    return {jsList, cssList};
  }
  if (options.assets) {
    jsList.push(...options.assets.js || []);
    cssList.push(...options.assets.css || []);
    return {jsList, cssList};
  }

  let url = options.html || options.next;
  if (!url) {
    return {jsList, cssList};
  }

  url = layer ? layer.formatUrl(url) : url;

  if (options.query) {
    if (url.includes('?')) {
      url = `${url}${options.query.replace('?', '&')}`;
    } else {
      url = `${url}${options.query}`;
    }
  }

  const fetchOption = options.credentials ? {
    fetch: (src: string) => {
      if (src.endsWith('.css') || src.endsWith('.js')) {
        return fetch(src);
      }
      return fetch(src, {
        credentials: 'include'
      });
    }
  }: {};

  const {
    scriptJson,
    scripts,
    styles,
    assetPublicPath,
    template,
    entry
  } = await importHtml(url, fetchOption.fetch as any);

  if (options.next) {
    return {
      execScripts: async (sandbox: Sandbox) => {
        execNextScripts(sandbox, scripts, scriptJson);
      },
      template,
      assetPublicPath,
      getExternalStyleSheets: () => getStyleContents(styles)
    };
  }

  if (options.html) {
    return {
      execScripts: async (sandbox: Sandbox) => {
        await execCommonScript(sandbox, scripts, entry);
      },
      template,
      assetPublicPath,
      getExternalStyleSheets: () => getStyleContents(styles)
    };
  }

  // if (options.html) {
  //   const {execScripts, getExternalStyleSheets, assetPublicPath, template} = await importHtml(url, fetchOption);
  //   return {execScripts, getExternalStyleSheets, assetPublicPath, template};
  // }
  // if (options.next) {
  //   const {getExternalStyleSheets, getExternalScriptJsons, getExternalScripts, assetPublicPath} = await importHtml(url, fetchOption);
  //   return {getExternalStyleSheets, assetPublicPath, execNextInSandbox: async (sandbox:any)=>{
  //     const list = await getExternalScripts();
  //     const json = getExternalScriptJsons?.() || {};
  //     execNextScripts(sandbox, list, json);
  //   }};
  // }

  return {jsList, cssList};
};
