import { Spin } from 'antd';
import styles from './index.module.less';

export function PageLoading() {
  return (
    <div className={styles.wrap}>
      <Spin size="large" description="加载中..." />
    </div>
  );
}
