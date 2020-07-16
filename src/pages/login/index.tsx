import React from 'react';
import { Form, Button, Input, Checkbox, Divider } from 'antd';
import Link from '@/components/link';
import { RouteContext } from 'universal-router';

const Page: React.FC<RouteContext> = () => {
  return (
    <Form layout="vertical" initialValues={{ remember: true }}>
      <Form.Item label="账号" name="username">
        <Input size="large" placeholder="邮箱/手机/用户名" />
      </Form.Item>
      <Form.Item label="密码" name="password">
        <Input size="large" placeholder="请输入登录密码" />
      </Form.Item>
      <Form.Item name="remember" valuePropName="checked">
        <Checkbox>记住密码</Checkbox>
      </Form.Item>
      <Form.Item>
        <Button type="primary" size="large" htmlType="submit" block>
          登录
        </Button>
      </Form.Item>
      <Form.Item>
        <Link to="/">找回密码</Link>
        <Divider type="vertical" />
        还没有注册账号？
        <Link to="/user/register">立即注册</Link>
      </Form.Item>
    </Form>
  );
};

export default Page;
