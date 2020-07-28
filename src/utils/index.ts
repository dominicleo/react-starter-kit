import qs from 'qs';
import isPlainObjectFn from 'is-plain-object';
import isBooleanFn from 'is-boolean-object';
export { default as isEqual } from 'lodash.isequal';

export const isPlainObject = (value: any): value is GeneralObject => isPlainObjectFn(value);
export const isNumber = (value: any): value is number => typeof value === 'number';
export const isString = (value: any): value is string => typeof value === 'string';
export const isArray = (value: any): value is any[] => Array.isArray(value);
export const isUndefined = (value: any): value is undefined => typeof value === 'undefined';
export const isFunction = (value: any): value is Function => typeof value === 'function';
export const isBoolean = (value: any): value is Boolean => isBooleanFn(value);

export function uniqueBySet(source: any[]) {
  return Array.from(new Set(source));
}

export function resolveURL(...urls: string[]) {
  return urls
    .map(url => (url || '').replace(/(^\/)|(\/$)/g, ''))
    .filter(Boolean)
    .join('/');
}

export function generateURL(url: string, params?: any) {
  const querystring = qs.stringify(params);
  return [url, querystring].filter(Boolean).join('?');
}
