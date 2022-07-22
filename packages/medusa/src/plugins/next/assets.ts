import {AssetItem} from '../../html-parse/utils';
import Sandbox from '../../sandbox';
import Log from '../../utils/log';

const _NEXT_DATA_HACK_STRING = 'JSON.parse(document.getElementById(\'__NEXT_DATA__\').textContent)';

export const execNextScripts = async (options: {
  sandbox: Sandbox, scripts: AssetItem[], scriptJson?: Record<string, any>
}) =>{
  const {sandbox, scripts, scriptJson: json} = options;
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
  sandbox.execScriptInSandbox(list.join(';\n'));
};
