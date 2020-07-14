import React, { FunctionComponent } from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './NotFound.css';

type PropTypes = {
  title: string;
};

const NotFound: FunctionComponent<PropTypes> = props => {
  useStyles(s);
  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>{props.title}</h1>
        <p>Sorry, the page you were trying to view does not exist.</p>
      </div>
    </div>
  );
};

export default NotFound;
