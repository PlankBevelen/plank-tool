import Icon from '@/lib/icon';
import { useMenuStore } from '@/stores/useMenuStore';
import { useUserStore } from '@/stores/useUserStore';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useMenuStore();
  const { isLoggedIn, user, favorites, logout } = useUserStore();

  const favText = useMemo(() => {
    if (!favorites.length) return '暂无收藏';
    return favorites.join('、');
  }, [favorites]);

  return (
    <div className="p-6 md:p-10 mx-auto max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center">
          <Icon name="settings" className="w-6 h-6 text-zinc-700" />
        </div>
        <div>
          <h1 className="text-zinc-900">设置</h1>
          <p className="text-sm text-zinc-500 mt-0.5">主题偏好与账号信息</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900">主题</div>
              <div className="text-sm text-zinc-500 mt-0.5">当前：{theme === 'dark' ? '深色' : '浅色'}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              切换主题
            </button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-medium text-zinc-900">账号</div>
              <div className="text-sm text-zinc-500 mt-0.5">
                {isLoggedIn ? `已登录：${user?.username ?? ''}` : '未登录'}
              </div>
            </div>
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-sm hover:bg-zinc-200 transition-colors"
              >
                退出登录
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
              >
                去登录
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs text-zinc-500">邮箱</div>
              <div className="text-sm text-zinc-900 mt-0.5">{user?.email ?? '-'}</div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs text-zinc-500">收藏</div>
              <div className="text-sm text-zinc-900 mt-0.5 break-words">{favText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

