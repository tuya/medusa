import React from 'react';
import {IRouteProps} from '../../route';
import {useStarApp} from './hooks';
import {useCommonLifecycle} from '../common';

/**
 * 乾坤和飞冰基本逻辑一致
 */
export const PluginIceStarkRoute: React.FC<IRouteProps> = (props) => {
  const ref = useCommonLifecycle(props, useStarApp);
  return <div ref={ref} />;
};
