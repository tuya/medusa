import {AssetItem} from '../../html-parse/utils';
import Sandbox from '../../sandbox';
import Log from '../../utils/log';

const _NEXT_DATA_HACK_STRING = 'JSON.parse(document.getElementById(\'__NEXT_DATA__\').textContent)';

export const execNextScripts = async (sandbox: Sandbox, scripts: AssetItem[], json?: Record<string, any>) =>{
  const list: string[] = [];

  for (const key in json || {}) {
    list.push(`window.${key}=${json![key]}`);
  }

  for (const script of scripts) {
    const st = script;
    if (typeof st.content === 'string') {
      if (st.hasRisk) {
        if (st.content.includes('document.createElement(\'canvas\')')) {
          continue;
        }
        if (st.content.includes(_NEXT_DATA_HACK_STRING)) {
          st.content = st.content.replace(_NEXT_DATA_HACK_STRING, '__NEXT_DATA__');
        }
      }
      list.push(st.content);
    } else if (st.async) {
      const str = await st.fetching;
      list.push(str);
    }
  }
  Log.info('_execNextScripts', {
    inScripts: scripts,
    outScripts: list
  });

  try {
    let execScript = `with (window) {;${list.join(';\n')}\n}`;
    const blob = new Blob([execScript], {type: 'application/javascript'});
    const url = URL.createObjectURL(blob);
    execScript = `${execScript}\n//# sourceURL=${url}\n`;
    const code = new Function('window', execScript).bind(sandbox);
    code(sandbox.getSandbox());
  } catch (error) {
    console.error(`error occurs when execute script in sandbox: ${error}`);
    throw error;
  }
};
