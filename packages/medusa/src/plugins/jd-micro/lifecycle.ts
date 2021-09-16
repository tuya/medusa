import Log from '../../utils/log';
import JDMicroApp from './app';

export enum lifeCycles {
  CREATED = 'created',
  BEFOREMOUNT = 'beforemount',
  MOUNTED = 'mounted',
  UNMOUNT = 'unmount',
  ERROR = 'error',
}


function eventHandler(event: CustomEvent, element: HTMLElement): void {
  Object.defineProperties(event, {
    currentTarget: {
      get() {
        return element;
      }
    },
    target: {
      get() {
        return element;
      }
    },
  });
}


export default function dispatchLifecyclesEvent(
    element: HTMLElement,
    appName: string,
    lifecycleName: lifeCycles,
    error?: Error,
): void {
  if (!element) {
    return console.error(
        Log.warn(`element does not exist in lifecycle ${lifecycleName}，it seems the app has unmounted`)
    );
  } else if (element instanceof ShadowRoot) {
    element = element.host as HTMLElement;
  }

  const detail = Object.assign({
    name: appName,
    container: element,
  }, error && {
    error
  });

  const event = new CustomEvent(lifecycleName, {
    detail,
  });

  eventHandler(event, element);

  JDMicroApp.getInstance().emit(appName, lifecycleName);

  element.dispatchEvent(event);
}
