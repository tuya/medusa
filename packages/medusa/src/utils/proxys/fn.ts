// check window contructor function， like Object Array
export function isConstructor(fn:any) {
  // generator function and has own prototype properties
  const hasConstructor = fn.prototype && fn.prototype.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1;
  // unnecessary to call toString if it has contructor function
  const functionStr = !hasConstructor && fn.toString();
  const upperCaseRegex = /^function\s+[A-Z]/;

  return (
    hasConstructor ||
    // upper case
    upperCaseRegex.test(functionStr) ||
    // ES6 class, window function do not have this case
    functionStr.slice(0, 5) === 'class'
  );
}

// get function from original window, such as scrollTo, parseInt
export function isWindowFunction(func:any) {
  return func && typeof func === 'function' && !isConstructor(func);
}
