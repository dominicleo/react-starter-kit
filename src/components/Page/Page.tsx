import React from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './Page.css';

interface PropTypes {
  title: string;
  html: string;
}

const Page = ({ title, html }: PropTypes) => {
  useStyles(s);
  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>{title}</h1>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};

export default Page;
