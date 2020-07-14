import axios from 'axios';

const headers: GeneralObject = {
  'Content-Type': 'application/json;charset=UTF-8',
  version: '1.0.0',
};

const fetch = axios.create({
  headers,
});

export default fetch;
