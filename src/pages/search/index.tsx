import React from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './index.module.less';

const Page = () => {
  useStyles(s);
  return <>test</>;
};

export default Page;
