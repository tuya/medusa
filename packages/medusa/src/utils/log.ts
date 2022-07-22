

const checkPass = () => {
  if (process.env.MED_LOG) {
    return true;
  }

  if (typeof localStorage !== 'undefined' && localStorage.getItem('MED_LOG')) {
    return true;
  }

  return false;
};

const Log = {
  info: (...args:any) => {
    checkPass() && console.log('[MED]', ...args);
  },
  warn: (...args: any) => {
    checkPass() && console.warn('[MED]', ...args);
  },
  error: (...args: any) => {
    checkPass() && console.error('[MED]', ...args);
  },
};

export default Log;
