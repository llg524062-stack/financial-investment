import { Button, Card, Checkbox, Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '@/api/modules/auth';
import { useAuthStore } from '@/store/authStore';
import { useThrottleFn } from '@/hooks/useThrottle';
import type { LoginFormValues } from '@/types/user';
import styles from './index.module.less';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form] = Form.useForm<LoginFormValues>();

  const onSubmit = useThrottleFn(async (values: LoginFormValues) => {
    try {
      const res = await loginApi(values);
      setAuth(res.token, res.user, values.remember);
      message.success('登录成功');
      navigate('/app/dashboard', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败');
    }
  });

  return (
    <div className={styles.page}>
      <Card className={styles.card} title="gll-金融投资指挥中台" variant="borderless">
        <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ remember: true }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="admin" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="任意密码（Mock）" size="large" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住密码</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
