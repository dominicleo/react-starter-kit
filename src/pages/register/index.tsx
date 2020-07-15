import React from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import { Form, Input, Button } from 'antd';
import s from './index.module.less';

const Page = () => {
  useStyles(s);
  return (
    <>
      <Form layout="vertical" initialValues={{ remember: true }}>
        <Form.Item label="邮箱地址" name="email">
          <Input size="large" placeholder="填写您常用的邮箱作为登录账号" />
        </Form.Item>
        <Form.Item label="用户名" name="username">
          <Input size="large" placeholder="中、英文均可，最长18个英文或9个汉字" />
        </Form.Item>
        <Form.Item label="密码" name="password">
          <Input size="large" placeholder="5-20位英文、数字、符号，区分大小写" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" size="large" htmlType="submit" block>
            注册
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default Page;
