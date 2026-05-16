import { Image } from 'antd';
import type { ImageProps } from 'antd';

interface ImagePreviewProps extends Omit<ImageProps, 'preview'> {
  src: string;
  alt?: string;
}

/** Reusable image with preview */
export function ImagePreview({ src, alt = '', ...rest }: ImagePreviewProps) {
  return <Image src={src} alt={alt} preview={{ mask: '预览' }} {...rest} />;
}
