import Icon from '@/lib/icon'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner';
import type { TabItem } from "@/components/PlankTab";
import PlankTab from "@/components/PlankTab";
import { useState } from "react";
import ImageCompress from './components/ImageCompress';
import ImageConvert from './components/ImageConvert';
import ImageMetadata from './components/ImageMetadata';
import QRCodeTool from './components/QRCodeTool';

type Tab = 'compress' | 'convert' | 'metadata' | 'qrcode';
const tabs: TabItem[] = [
  {
    id: 'compress',
    label: '图片压缩',
  },
  {
    id: 'convert',
    label: '格式转换',
  },
  {
    id: 'metadata',
    label: 'Exif/隐私',
  },
  {
    id: 'qrcode',
    label: '二维码生成',
  }
];

export default function ImageTool() {
  const [activeTab, setActiveTab] = useState<Tab>('compress');
  const { favorites, toggleFavorite, isLoggedIn } = useUserStore();
  const isFav = favorites.includes('image');

  const handleFavorite = () => {
    if (!isLoggedIn) { toast.error('请先登录'); return; }
    toggleFavorite('image');
    toast.success(isFav ? '已取消收藏' : '收藏成功');
  };

  return (
    <div className="p-6 md:p-10 mx-auto">
      <div className="flex items-center mb-8">
        <div className="mr-12">
          <h1 className="text-zinc-900">图片工具</h1>
          <p className="text-sm text-zinc-500 mt-0.5">图片压缩、格式转换与二维码生成</p>
        </div>
        <button onClick={handleFavorite}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all border
            ${isFav ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'}`}>
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
      {activeTab === 'compress' && <ImageCompress />}
      {activeTab === 'convert' && <ImageConvert />}
      {activeTab === 'metadata' && <ImageMetadata />}
      {activeTab === 'qrcode' && <QRCodeTool />}
    </div>
  )
}
