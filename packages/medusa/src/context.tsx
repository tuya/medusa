import React, {useMemo} from 'react';
import Layer from './utils/path';

export type IContextType = {
  appId: string
  rootId: string
  urlMap?: {[key:string]:{js?: Array<string>, css?: Array<string>}}
  layer?: Layer
  queryStr?: string
  pathname?: string
  onAppEnter?: (id: string) => void
  onAppLeave?: (id:string) => void
  onAppLoading: (b: boolean) => void
  onAppError: (str?: string) => void
  fetch?: typeof fetch
}

export const RouteContext = React.createContext<IContextType|null>(null);

export const RouteContextProvider: React.FC<IContextType> = (props) => {
  const values = useMemo(() => {
    return props;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.values(props)]);

  return <RouteContext.Provider value={values}>
    {props.children}
  </RouteContext.Provider>;
};
