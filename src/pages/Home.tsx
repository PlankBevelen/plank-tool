import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';
import Icon from '@/lib/icon';

const tools = [
  {
    id: 'text',
    label: '文本工具',
    path: '/text',
    icon: 'text',
    desc: '文本 Diff 对比：双屏对比差异',
    badge: '1 项功能',
  },
  {
    id: 'image',
    label: '图片工具',
    path: '/image',
    icon: 'image',
    desc: '图片压缩 · 格式转换 · 二维码生成',
    badge: '2 项功能',
  },
  {
    id: 'json',
    label: 'JSON 工具',
    path: '/json',
    icon: 'json',
    desc: 'JSON 格式化 · 转换 · 类型推导',
    badge: '3 项功能',
  },
  {
    id: 'jwt',
    label: 'JWT 工具',
    path: '/jwt',
    icon: 'jwt',
    desc: 'JWT 解析 · 过期检查 · HS256 验签',
    badge: '3 项功能',
  },
  {
    id: 'codec',
    label: '编码工具',
    path: '/codec',
    icon: 'code',
    desc: 'Base64 · URL · Unicode · 哈希 · UUID · 正则',
    badge: '6 项功能',
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function Home() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isLoggedIn } = useUserStore();

  const handleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('请先登录');
      return;
    }
    toggleFavorite(id);
    toast.success(favorites.includes(id) ? '已取消收藏' : '收藏成功');
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Icon name='icon' className="w-12 h-12" />
          <span className="text-sm text-zinc-500 tracking-wide">React 综合工具站</span>
        </div>
        <h1 className="text-zinc-900 mb-3">一站式开发者工具</h1>
        <p className="text-zinc-500 max-w-lg leading-relaxed">
          精心收录高频使用工具，无需注册，即开即用。文本处理、时间计算、图片处理、JSON 解析，一站搞定。
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {tools.map((tool) => {
          const isFav = favorites.includes(tool.id);
          return (
            <motion.div
              key={tool.id}
              variants={itemVariants}
              onClick={() => navigate(tool.path)}
              className="group relative cursor-pointer rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:shadow-sm transition-all duration-200 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                  {/* <Icon size={19} className="text-zinc-700" /> */}
                  <Icon name={tool.icon} className="w-8 h-8" />
                </div>
                <button
                  onClick={(e) => handleFavorite(e, tool.id)}
                  className={`p-1.5 rounded-lg transition-all duration-150
                    ${isFav
                      ? 'text-amber-400'
                      : 'text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                    }
                  `}
                >
                  {/* <Star size={15} fill={isFav ? 'currentColor' : 'none'} /> */}
                  <Icon name='star' className={`w-5 h-5 ${isFav ? 'fill-currentColor' : 'fill-none'}`} />
                </button>
              </div>

              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-zinc-900">{tool.label}</h3>
                <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">{tool.badge}</span>
              </div>
              <p className="text-sm text-zinc-500">{tool.desc}</p>

              <div className="mt-5 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-700 transition-colors">
                <span>立即使用</span>
                <Icon name="right" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center gap-2 text-sm text-zinc-400"
      >
        <Icon name="star" className="w-5 h-5 text-amber-400" />
        <span>登录后可收藏常用工具，随时快速访问</span>
      </motion.div>
    </div>
  );
}
