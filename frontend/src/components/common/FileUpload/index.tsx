import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface FileUploadProps {
  multiple?: boolean;
  maxCount?: number;
  accept?: string;
  onChange?: UploadProps['onChange'];
}

/** Single / multi file upload */
export function FileUpload({ multiple = false, maxCount = 5, accept, onChange }: FileUploadProps) {
  const props: UploadProps = {
    multiple,
    maxCount,
    accept,
    onChange,
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) message.error('文件不能超过 10MB');
      return false;
    },
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
      <p className="ant-upload-hint">支持单个或批量上传，单文件不超过 10MB</p>
    </Dragger>
  );
}
