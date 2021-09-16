export const push = (path:string) => history.pushState({}, '', path);

export const replace = (path:string) => history.replaceState({}, '', path);
