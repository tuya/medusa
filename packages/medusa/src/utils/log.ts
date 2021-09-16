

const Log = {
  info: (...args:any) => {
    console.log('[MED]', ...args);
  },
  warn: (...args: any) => {
    console.warn('[MED]', ...args);
  },
  error: (...args: any) => {
    console.error('[MED]', ...args);
  },
};

export default Log;
