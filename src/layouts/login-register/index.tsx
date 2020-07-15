import React from 'react';
import classnames from 'classnames';
import { RouteContext } from 'universal-router';
import { Row, Col } from 'antd';
import useStyles from 'isomorphic-style-loader/useStyles';
import history from '@/utils/history';
import s from './index.module.less';

const TABS = [
  {
    key: 'login',
    label: '登录账号',
    pathname: '/login',
  },
  {
    key: 'register',
    label: '注册账号',
    pathname: '/register',
  },
];

const LoginRegisterLayout: React.FC<RouteContext> = props => {
  useStyles(s);

  const onClick = (pathname: string) => {
    if (pathname === props.pathname) return;
    history.replace(pathname);
  };

  return (
    <div className={s.layout}>
      <div className={s.tabs}>
        <Row>
          {TABS.map(tab => (
            <Col
              key={tab.key}
              flex={1}
              className={classnames(s.tab, {
                [s.selected]: tab.pathname === props.pathname,
              })}
              onClick={() => onClick(tab.pathname)}
            >
              {tab.label}
            </Col>
          ))}
        </Row>
        <div className={s.content}>{props.children}</div>
      </div>
    </div>
  );
};

export default LoginRegisterLayout;
