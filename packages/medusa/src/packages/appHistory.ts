import {topWindow} from '../common';

export const push = (path:string) => history.pushState({}, '', path);

export const replace = (path:string) => history.replaceState({}, '', path);

export const pushTopNext = (url: string, as: string) => {
  topWindow.next?.router?.push(url, as);
};

export const replaceTopNext = (url: string, as: string) => {
  topWindow.next?.router?.replace(url, as);
};
