import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

type ITyStore = {
  __tyReduxStore?: BehaviorSubject<any>
  __tyStoreMap?: Map<string, BehaviorSubject<any>>
}

export const TY_STORE_NAMESPACE = 'TY_STORE_NAMESPACE';


declare let window:any;

const storeWin:ITyStore = typeof window === 'undefined' ? {} : (window);

interface Action<T = any> {
  type: T
}

interface AnyAction extends Action {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any
}

interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T): T
}

interface Unsubscribe {
  (): void
}

interface Store<S = any, A extends Action = AnyAction> {
  dispatch: Dispatch<A>
  getState(): S
  subscribe(listener: () => void): Unsubscribe
}

export const registerRedux = (store:Store) => {
  // cache last state
  const reduxSubject = new BehaviorSubject(store.getState());
  store.subscribe(()=>{
    reduxSubject.next(store.getState());
  });
  if (typeof window === 'undefined') {
    return;
  }
  if (storeWin.__tyReduxStore) {
    throw new Error('Currently we only support one redux store, If you realy need multiple instance please contact us !!');
  }
  storeWin.__tyReduxStore = reduxSubject;
  return reduxSubject;
};


export const subscribeRedux = (listener: (v:any) => void) => {
  if (!storeWin.__tyReduxStore) {
    return;
  }
  const observal = storeWin.__tyReduxStore.subscribe(listener);
  return observal;
};

const getSubject = (key?: string) => {
  key = key || TY_STORE_NAMESPACE;
  if (!storeWin.__tyStoreMap) {
    storeWin.__tyStoreMap = new Map;
  }
  if (!storeWin.__tyStoreMap.has(key)) {
    storeWin.__tyStoreMap.set(key, new BehaviorSubject(undefined));
  }
  const subject = storeWin.__tyStoreMap.get(key)!;
  return subject;
};

export const subscribe = (listener: (v: Record<string, any>) => void, namespace?: string) => {
  const store = getSubject(namespace);
  return store.subscribe((v) => {
    if (v !== undefined) {
      listener(v);
    }
  });
};

export const dispatch = (state: {[key:string]: any} = {}, merge = true, namespace?: string) => {
  if (typeof state !== 'object') {
    throw new Error('dispatch value must be object');
  }
  const store = getSubject(namespace);
  let v = store.getValue();
  if (merge) {
    v = Object.assign({}, v, state);
  } else {
    v = {...state};
  }
  store.next(v);
};

export const getState = (namespace?: string) => {
  const store = getSubject(namespace);
  return store.getValue();
};
