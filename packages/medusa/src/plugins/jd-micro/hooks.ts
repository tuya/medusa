import Log from '../../utils/log';
import React, {useEffect} from 'react';
import jdMicroApp from './app';

export const useCheckZoe = (children?: React.ReactNode) => {
  useEffect(() => {
    let hasJdMicro = false;
    for (const ele of React.Children.toArray(children)) {
      if (React.isValidElement(ele) && ele.props.framework === 'zoe') {
        hasJdMicro = true;
        break;
      }
    }
    if (hasJdMicro) {
      Log.info('check zoe-micro');
      jdMicroApp.getInstance().start();
    }
  }, [children]);
};
