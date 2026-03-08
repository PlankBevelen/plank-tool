import { useState } from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

interface PlankTabProps {
  /** Tab 数据数组 */
  tabs: TabItem[];
  /** 默认选中的 ID，非受控模式使用 */
  defaultActiveId?: string;
  /** 当前选中的 ID，受控模式使用 */
  activeId?: string;
  /** 切换回调 */
  onChange?: (id: string) => void;
  /** 额外的容器类名 */
  className?: string;
}

export default function PlankTab({
  tabs,
  defaultActiveId,
  activeId: controlledActiveId,
  onChange,
  className
}: PlankTabProps) {
  // 内部状态，用于非受控模式或作为中间状态
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId || tabs[0]?.id);

  // 优先使用受控属性，否则使用内部状态。如果内部状态失效（不在 tabs 中），回退到第一个
  const activeTab = controlledActiveId !== undefined 
    ? controlledActiveId 
    : (tabs.find(t => t.id === internalActiveId) ? internalActiveId : tabs[0]?.id);

  const handleTabClick = (id: string) => {
    if (controlledActiveId === undefined) {
      setInternalActiveId(id);
    }
    onChange?.(id);
  };

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className={clsx("flex gap-1 p-1 bg-zinc-100 rounded-lg w-fit", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={clsx(
              "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
            )}
            type="button"
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
