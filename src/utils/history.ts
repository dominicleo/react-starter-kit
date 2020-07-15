import { createBrowserHistory, createMemoryHistory, History } from 'history';

const history = process.env.BROWSER ? createBrowserHistory() : createMemoryHistory();

// Navigation manager, e.g. history.push('/home')
// https://github.com/mjackson/history

export default history as NonNullable<History>;
