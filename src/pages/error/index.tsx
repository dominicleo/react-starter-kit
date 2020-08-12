import React from 'react';
import { Button, Result } from 'antd';

interface PropTypes {
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}

const ErrorPage: React.FC<PropTypes> = ({ error }) => {
  return (
    <Result
      status={500}
      title="服务器发生了错误"
      subTitle={__DEV__ && error && <pre>{error.stack}</pre>}
      extra={
        <Button type="primary" href="/">
          刷新页面
        </Button>
      }
    />
  );
};

export default ErrorPage;
