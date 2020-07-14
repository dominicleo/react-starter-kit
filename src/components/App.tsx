import React, { ReactNode } from 'react';
import StyleContext from 'isomorphic-style-loader/StyleContext';
import AppContext, { AppContextTypes } from '../context';

interface Props {
  insertCss: Function;
  context: AppContextTypes;
  children: ReactNode;
}

const App = ({ insertCss, context, children }: Props) => (
  <AppContext.Provider value={context}>
    <StyleContext.Provider value={{ insertCss }}>
      {children}
    </StyleContext.Provider>
  </AppContext.Provider>
);

export default App;
