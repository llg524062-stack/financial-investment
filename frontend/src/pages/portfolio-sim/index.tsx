import { useRef } from 'react';
import { Form, InputNumber, Button } from 'antd';
import { useLineChart } from '@/hooks/useLineChart';
import { useThrottleFn } from '@/hooks/useThrottle';

export default function PortfolioSimPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [100,102,105,110,115,120,125,130,135,140], '#10b981');
  const onSim = useThrottleFn(() => {});
  return (
    <section className="panel active">
      <div className="section-header"><h2>收益模拟器</h2></div>
      <Form layout="inline" onFinish={onSim}>
        <Form.Item name="amount" label="本金" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
        <Button type="primary" htmlType="submit">模拟</Button>
      </Form>
      <div className="chart-area" style={{ marginTop: 16 }}><canvas ref={ref} /></div>
    </section>
  );
}
