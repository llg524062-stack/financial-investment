import { useEffect, useMemo, useState, type ReactNode } from 'react';

export interface SubTabItem {
  key: string;
  label: string;
  content: ReactNode;
  hidden?: boolean;
}

interface SubTabsProps {
  items: SubTabItem[];
  defaultKey?: string;
  className?: string;
  onChange?: (key: string) => void;
}

export function SubTabs({ items, defaultKey, className = 'sub-tabs', onChange }: SubTabsProps) {
  const visible = useMemo(() => items.filter((i) => !i.hidden), [items]);
  const visibleKeys = visible.map((i) => i.key).join(',');

  const [active, setActive] = useState(() => {
    const initial = defaultKey ?? visible[0]?.key ?? '';
    return visible.some((v) => v.key === initial) ? initial : (visible[0]?.key ?? '');
  });

  useEffect(() => {
    if (!visible.some((v) => v.key === active)) {
      const next = defaultKey && visible.some((v) => v.key === defaultKey)
        ? defaultKey
        : (visible[0]?.key ?? '');
      setActive(next);
    }
  }, [visibleKeys, defaultKey, active, visible]);

  const handleClick = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  if (visible.length === 0) return null;

  return (
    <>
      <div className={className}>
        {visible.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sub-tab${active === item.key ? ' active' : ''}`}
            onClick={() => handleClick(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visible.map((item) => (
        <div
          key={item.key}
          id={item.key}
          className={`sub-panel${active === item.key ? ' active' : ''}`}
        >
          {item.content}
        </div>
      ))}
    </>
  );
}
