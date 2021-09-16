import React from 'react';
import {IRouteProps} from '../../route';
import {useStarApp} from './hooks';
import {useCommonLifecycle} from '../common';

export const PluginNextRoute: React.FC<IRouteProps> = (props) => {
  const ref = useCommonLifecycle(props, useStarApp);
  return <div ref={ref} />;
};
