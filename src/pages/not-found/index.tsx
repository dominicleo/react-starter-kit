import React from 'react';

import s from './index.css';

type PropTypes = {
  title: string;
};

const NotFound: React.FC<PropTypes> = props => {
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
