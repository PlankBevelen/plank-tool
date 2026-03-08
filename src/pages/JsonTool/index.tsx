import Icon from "@/lib/icon";
import { useState } from "react";
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';
import type { TabItem } from "@/components/PlankTab";
import PlankTab from "@/components/PlankTab";
import JsonFormat from "./components/JsonFormat";
import JsonConvert from "./components/JsonConvert";
import { motion } from "framer-motion";

type Tab = 'format' | 'convert';
const tabs: TabItem[] = [
  {
    id: 'format',
    label: '格式化&校验',
  },
  {
    id: 'convert',
    label: '格式转换',
  },
];

export default function JsonTool() {

  const [activeTab, setActiveTab] = useState<Tab>('format');
  const { favorites, toggleFavorite, isLoggedIn } = useUserStore();
  const isFav = favorites.includes('json');

  const handleFavorite = () => {
    if (!isLoggedIn) { toast.error('请先登录'); return; }
    toggleFavorite('json');
    toast.success(isFav ? '已取消收藏' : '收藏成功');
  };

  return (
    <div className="p-6 md:p-10 mx-auto">
      <div className="flex items-center mb-8">
        <div className="mr-12">
          <h1 className="text-zinc-900">JSON 工具</h1>
          <p className="text-sm text-zinc-500 mt-0.5">JSON 格式化、校验与格式转换</p>
        </div>
        <button onClick={handleFavorite}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all border
            ${isFav ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'}`}>
          {/* <Star size={14} fill={isFav ? 'currentColor' : 'none'} /> */}
          <Icon name='star' className="w-5 h-5"/>
          <span>{isFav ? '已收藏' : '收藏'}</span>
        </button>
      </div>

      <PlankTab 
        tabs={tabs}
        activeId={activeTab}
        onChange={(id: string) => setActiveTab(id as Tab)}
      />

      <div className="mt-8"></div>

      <motion.div key={activeTab} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
        {activeTab === 'format' && <JsonFormat />}
        {activeTab === 'convert' && <JsonConvert />}
      </motion.div>

    </div>
  )
}