import {AssetItem, resetScope} from '../../html-parse/utils';
import Sandbox from '../../sandbox';
import Log from '../../utils/log';
import {getGlobalProp, noteGlobalProps} from '../../utils/umd';

const getRandomId = () => {
  return `med_${Math.random().toString(16).slice(2, 8)}`;
};

const appendCss = async (url:string, id:string) => {
  const root = document.getElementsByTagName('head')[0];
  return new Promise((rs, rj) => {
    const element: HTMLLinkElement = document.createElement('link');
    element.id = id;
    element.rel = 'stylesheet';
    element.href = url;

    element.addEventListener(
        'error',
        () => {
          console.error(`css asset loaded error: ${url}`);
          return rs(null);
        },
        false,
    );
    element.addEventListener('load', () => rs(null), false);

    root.appendChild(element);
  });
};

const appendInlineStyle = async (content:string, id:string) => {
  const root = document.getElementsByTagName('head')[0];
  const element = document.createElement('style');
  element.id = id;
  element.innerHTML = content;
  root.appendChild(element);
};

const appendScopeStyle = async (content:string, container:HTMLElement) => {
  const element = document.createElement('style');
  element.innerHTML = content;
  const parent = container.parentNode as HTMLDivElement;
  if (parent) {
    const id = parent.id;
    if (!id) {
      const randomId = getRandomId();
      parent.id = randomId;
    }
    const str = resetScope(`#${parent.id}`, content);
    element.innerHTML = str;
    parent.insertBefore(element, container);
  }
};

/**
 * js文件缓存
 */
const _scriptCache:{[key:string]:string} = {};

export const appendAssets = async (props: {
  jsList?: string[]
  cssList?: string[]
  styleList?: string[]
  container?: HTMLElement
}) => {
  const idList: string[] = [];

  const jsSourceList: string[] = [];

  const {cssList, styleList, jsList} = props;

  if (cssList?.length) {
    await Promise.all(cssList.map(async (url, index)=>{
      const id = `TUYA_CSS_${Math.random().toString(16).substr(2)}`;
      idList.push(id);
      await appendCss(url, id);
    }));
  }

  styleList?.forEach((str)=>{
    if (props.container?.parentNode) {
      appendScopeStyle(str, props.container);
    } else {
      const id = `TUYA_INLINE_STYLE_${Math.random().toString(16).substr(2)}`;
      idList.push(id);
      appendInlineStyle(str, id);
    }
  });

  if (jsList?.length) {
    const jsContentList = await Promise.all(jsList.map(async (url)=>{
      if (_scriptCache[url]) {
        return _scriptCache[url];
      }
      const resp = await fetch(url);
      const str = await resp.text();
      _scriptCache[url] = str;
      return str;
    }));
    jsContentList.forEach((str) => {
      jsSourceList.push(str);
    });
  }

  return {
    idList,
    jsSourceList,
  };
};

export const execCommonScript = async (sandbox: Sandbox, scripts: AssetItem[], entry?: string) =>{
  const list: AssetItem[] = [];

  for (const script of scripts) {
    const st = script;
    if (typeof st.content === 'string') {
      list.push(st);
    } else if (st.async && st.fetching) {
      const str = await st.fetching;
      list.push({
        ...st,
        content: str
      });
    }
  }
  Log.info('_execCommonScript', {
    inScripts: scripts,
    outScripts: list
  });

  let exps: Record<string, any> | undefined = undefined;

  list.forEach((item) => {
    if (!item.content) {
      return;
    }
    if (entry && item.src === entry) {
      noteGlobalProps(sandbox.getSandbox());
      sandbox.execScriptInSandbox(item.content, item.src);
      exps = sandbox.getSandbox()?.[getGlobalProp(sandbox.getSandbox())] || {};
      sandbox.lifecycle = exps as any;
    } else {
      sandbox.execScriptInSandbox(item.content, item.src);
    }
  });
};
