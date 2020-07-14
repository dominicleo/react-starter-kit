import React from 'react';
import Home from '@/pages/home/Home';

async function action() {
  return {
    title: 'React Starter Kita',
    chunks: ['home'],
    component: <Home />,
  };
}

export default action;
