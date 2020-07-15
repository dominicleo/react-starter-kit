import React from 'react';
import { Input, Layout, Row, Col } from 'antd';
import { APP_NAME } from '@/constants/common';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './index.module.less';
import Link from '@/components/link';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const BasicLayout: React.FC = props => {
  useStyles(s);
  return (
    <Layout className={s.layout}>
      <Header className={s.header}>
        <Row gutter={24}>
          <Col flex={1}>
            <Link to="/">{APP_NAME}</Link>
          </Col>
          <Col>
            <Search className={s.search} />
          </Col>
          <Col>
            <Link to="/login">登录</Link>
          </Col>
          <Col>
            <Link to="/register">注册</Link>
          </Col>
        </Row>
      </Header>
      <Content className={s.content}>{props.children}</Content>
      <Footer className={s.footer}>{APP_NAME} © 2020</Footer>
    </Layout>
  );
};

export default BasicLayout;
