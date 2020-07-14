import React, { FunctionComponent } from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';

import s from './Layout.css';
import Header from '../Header';
import Feedback from '../Feedback';
import Footer from '../Footer';

interface PropTypes {}

const Layout: FunctionComponent<PropTypes> = ({ children }) => {
  useStyles(s);
  return (
    <div>
      <Header />
      {children}
      <Feedback />
      <Footer />
    </div>
  );
};

export default Layout;
