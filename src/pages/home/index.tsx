import React from 'react';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './index.module.less';

interface HeadlineProps {
  title: any;
  subtitle?: any;
}

const Headline: React.FC<HeadlineProps> = props => {
  return (
    <div className={s.headline}>
      <h3 className={s.title}>{props.title}</h3>
      <div className={s.subtitle}>{props.subtitle}</div>
    </div>
  );
};

const Page = () => {
  useStyles(s);
  return (
    <>
      <div className={s.banner} />
      <div className={s.section}>
        <Headline title="课程列表" subtitle="此为模块副标题1" />
      </div>
      <div className={s.section}>
        <Headline title="网校动态" subtitle="此为模块副标题2" />
      </div>
      <div className={s.section}>
        <Headline title="推荐教师" subtitle="此为模块副标题3" />
      </div>
    </>
  );
};

export default Page;
