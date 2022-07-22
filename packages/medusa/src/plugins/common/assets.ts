import {AssetItem, resetScope} from '../../html-parse/utils';
import Sandbox from '../../sandbox';
import Log from '../../utils/log';
import {getGlobalProp, noteGlobalProps} from '../../utils/umd';

const getRandomId = () => {
  return `med_${Math.random().toString(16).slice(2, 8)}`;
};

const appendCss = async (url:string, id:string) => {
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

    /**
     * 兼容next
     */
    const CSS_MOUNT_POINT = document.getElementById('__nc_mp__');
    if (CSS_MOUNT_POINT) {
      document.head.insertBefore(element, CSS_MOUNT_POINT);
    } else {
      document.head.appendChild(element);
    }
  });
};

type IStyleITem = {content: string, attrs?: Array<{key: string, value: string}>}


const appendInlineStyle = async (style:IStyleITem, id:string) => {
  const element = document.createElement('style');
  element.id = id;
  element.innerHTML = style.content;
  style.attrs?.forEach((attr) => {
    element.setAttribute(attr.key, attr.value);
  });
  /**
   * 兼容next
   */
  const CSS_MOUNT_POINT = document.getElementById('__nc_mp__');
  if (CSS_MOUNT_POINT) {
    document.head.insertBefore(element, CSS_MOUNT_POINT);
  } else {
    document.head.appendChild(element);
  }
};

const appendScopeStyle = async (style:IStyleITem, container:HTMLElement, type: 'id' | 'property') => {
  const element = document.createElement('style');
  element.innerHTML = style.content;
  const parent = container.parentNode as HTMLDivElement;
  if (parent) {
    const id = parent.id;
    if (!id) {
      const randomId = getRandomId();
      parent.id = randomId;
      parent.setAttribute('data-medusa', parent.id);
    }
    const prefix = type === 'property' ? `$[${parent.localName}][data-medusa="${parent.id}"]` : `#${parent.id}`;
    const str = resetScope(prefix, style.content);
    element.innerHTML = str;
    parent.insertBefore(element, container);
  }
};

/**
 * js文件缓存
 */
export const _scriptCache:{[key:string]:string} = {};

export const appendAssets = async (props: {
  jsList?: string[]
  cssList?: string[]
  styleList?: Array<IStyleITem>
  container?: HTMLElement
  scopeCss?: 'id' | 'property' | boolean
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

  styleList?.forEach((st)=>{
    if (props.container?.parentNode && props.scopeCss) {
      appendScopeStyle(st, props.container, props.scopeCss === true ? 'id' : props.scopeCss);
    } else {
      const id = `TUYA_INLINE_STYLE_${Math.random().toString(16).substr(2)}`;
      idList.push(id);
      appendInlineStyle(st, id);
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

export const execCommonScript = async (options: {
  sandbox: Sandbox, scripts: AssetItem[], entry?: string
  scriptJson?: Record<string, any>
}) =>{
  const {sandbox, scripts, entry, scriptJson} = options;
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


  for (const id in scriptJson || {}) {
    sandbox.execScriptInSandbox(`
      var st = document.createElement('script');
      st.id = '${id}';
      st.textContent = '${scriptJson![id]}';
      st.setAttribute('type', 'application/json');
      document.head.appendChild(st);
    `);
  }

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
