import React, { ComponentType } from 'react';
import cx from 'classnames';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './Navigation.css';
import Link from '../Link';

const Navigation: ComponentType<{}> = () => {
  useStyles(s);
  return (
    <div className={s.root} role="navigation">
      <Link className={s.link} to="/about">
        About
      </Link>
      <Link className={s.link} to="/contact">
        Contact
      </Link>
      <span className={s.spacer}> | </span>
      <Link className={s.link} to="/login">
        Log in
      </Link>
      <span className={s.spacer}>or</span>
      <Link className={cx(s.link, s.highlight)} to="/register">
        Sign up
      </Link>
    </div>
  );
};

export default Navigation;
