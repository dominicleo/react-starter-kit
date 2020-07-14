import React from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './Feedback.css';

const Feedback = () => {
  useStyles(s);
  return (
    <div className={s.root}>
      <div className={s.container}>
        <a
          className={s.link}
          href="https://gitter.im/kriasoft/react-starter-kit"
        >
          Ask a question
        </a>
        <span className={s.spacer}>|</span>
        <a
          className={s.link}
          href="https://github.com/kriasoft/react-starter-kit/issues/new"
        >
          Report an issue
        </a>
      </div>
    </div>
  );
};

export default Feedback;
