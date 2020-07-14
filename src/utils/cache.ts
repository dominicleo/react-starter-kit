import localforage from 'localforage';

const Cache = localforage.createInstance({
  name: 'LANCET',
  // INDEXEDDB | LOCALSTORAGE | WEBSQL default:INDEXEDDB
  driver: localforage.LOCALSTORAGE,
});

export default Cache;
