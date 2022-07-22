import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {TY_STORE_CACHE_LIST_VAR} from '../common';


type ITyStore = {
  __tyReduxStore?: BehaviorSubject<any>
  __tyStoreMap?: Map<string, BehaviorSubject<any>>
  [TY_STORE_CACHE_LIST_VAR]?: any[]
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
    throw new Error('Currently we only support one redux store, If you realy need multiple instance please contact tuya-fe-efficacy !!');
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

const rmSubject = (key?: string) => {
  key = key || TY_STORE_NAMESPACE;
  if (!storeWin.__tyStoreMap) {
    storeWin.__tyStoreMap = new Map;
  }
  if (storeWin.__tyStoreMap.has(key)) {
    storeWin.__tyStoreMap.delete(key);
  }
};

export const subscribe = (listener: (v: Record<string, any>) => void, namespace?: string) => {
  const store = getSubject(namespace);

  let flag = false;


  const unsub = store.subscribe((v) => {
    if (v !== undefined) {
      listener(v);
    }
  });


  if (Array.isArray(storeWin[TY_STORE_CACHE_LIST_VAR])) {
    flag = true;
    storeWin[TY_STORE_CACHE_LIST_VAR]?.push(unsub);
  }

  return {
    unsubscribe: () => {
      if (flag) {
        storeWin[TY_STORE_CACHE_LIST_VAR] = storeWin[TY_STORE_CACHE_LIST_VAR]?.filter((z) => z !== unsub);
      }
      unsub.unsubscribe();
    },
  };
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

export const clearSubject = (namespace?: string) => {
  const store = getSubject(namespace);
  if (store) {
    store.unsubscribe();
    rmSubject(namespace);
  }
};

export const clearListeners = (namespace?: string) => {
  const store = getSubject(namespace);
  if (store) {
    store.observers = [];
  }
};


export const getState = (namespace?: string) => {
  const store = getSubject(namespace);
  return store.getValue();
};
