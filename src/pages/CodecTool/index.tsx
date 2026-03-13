import Icon from '@/lib/icon';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';
import type { TabItem } from '@/components/PlankTab';
import PlankTab from '@/components/PlankTab';
import { useState } from 'react';
import Base64Tool from './components/Base64Tool';
import UrlTool from './components/UrlTool';
import UnicodeTool from './components/UnicodeTool';
import HashTool from './components/HashTool';
import UuidTool from './components/UuidTool';
import RegexTool from './components/RegexTool';

type Tab = 'base64' | 'url' | 'unicode' | 'hash' | 'uuid' | 'regex';

const tabs: TabItem[] = [
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'unicode', label: 'Unicode' },
  { id: 'hash', label: '哈希' },
  { id: 'uuid', label: 'UUID' },
  { id: 'regex', label: '正则' },
];

export default function CodecTool() {
  const [activeTab, setActiveTab] = useState<Tab>('base64');
  const { favorites, toggleFavorite, isLoggedIn } = useUserStore();
  const isFav = favorites.includes('codec');

  const handleFavorite = () => {
    if (!isLoggedIn) { toast.error('请先登录'); return; }
    toggleFavorite('codec');
    toast.success(isFav ? '已取消收藏' : '收藏成功');
  };

  return (
    <div className="p-6 md:p-10 mx-auto">
      <div className="flex items-center mb-8">
        <div className="mr-12">
          <h1 className="text-zinc-900">编码工具</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Base64、URL、Unicode、哈希、UUID 与正则测试台</p>
        </div>
        <button
          onClick={handleFavorite}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all border
            ${isFav ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'}`}
        >
          <Icon name='star' className="w-5 h-5" />
          <span>{isFav ? '已收藏' : '收藏'}</span>
        </button>
      </div>

      <PlankTab
        tabs={tabs}
        activeId={activeTab}
        onChange={(id: string) => setActiveTab(id as Tab)}
      />

      <div className="mt-8"></div>

      {activeTab === 'base64' && <Base64Tool />}
      {activeTab === 'url' && <UrlTool />}
      {activeTab === 'unicode' && <UnicodeTool />}
      {activeTab === 'hash' && <HashTool />}
      {activeTab === 'uuid' && <UuidTool />}
      {activeTab === 'regex' && <RegexTool />}
    </div>
  );
}

