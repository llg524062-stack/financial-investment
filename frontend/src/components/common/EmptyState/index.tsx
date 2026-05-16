import { Empty } from 'antd';
import styles from './index.module.less';

interface EmptyStateProps {
  description?: string;
}

export function EmptyState({ description = '暂无数据' }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <Empty description={description} />
    </div>
  );
}
