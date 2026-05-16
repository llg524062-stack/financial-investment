import { useState } from 'react';
import { Button, Card, Checkbox, Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '@/api/modules/auth';
import { useAuthStore } from '@/store/authStore';
import { DEMO_PASSWORD, DEMO_USERNAME } from '@/utils/constants';
import type { LoginFormValues } from '@/types/user';
import styles from './index.module.less';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await loginApi(values);
      setAuth(res.token, res.user, values.remember);
      message.success('登录成功');
      navigate('/app/dashboard', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card} title="gll-金融投资指挥中台" variant="borderless">
        <p className={styles.hint}>
          演示账号：<strong>{DEMO_USERNAME}</strong> / <strong>{DEMO_PASSWORD}</strong>
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{
            remember: true,
            username: DEMO_USERNAME,
            password: DEMO_PASSWORD,
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder={DEMO_USERNAME} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住密码</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
