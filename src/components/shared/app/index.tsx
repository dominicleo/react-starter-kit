import React, { ReactNode } from 'react';
import StyleContext from 'isomorphic-style-loader/StyleContext';
import AppContext, { AppContextTypes } from './context';

interface AppProps {
  context: AppContextTypes;
  children: ReactNode;
}

const App: React.FC<AppProps> = ({ context, children }) => (
  <AppContext.Provider value={context}>{children}</AppContext.Provider>
);

export default App;
