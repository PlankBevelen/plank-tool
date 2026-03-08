import Icon from "@/lib/icon";
import { useMenuStore } from "@/stores/useMenuStore";
import { useUserStore } from '@/stores/useUserStore';
import { useNavigate } from 'react-router';

export default function Header() {
  const { toggleSidebar, sidebarCollapsed } = useMenuStore();
  const { isLoggedIn, user, logout } = useUserStore();
  const navigate = useNavigate();

  return (
    <header className="h-14 flex-shrink-0 border-b border-zinc-200 bg-white flex items-center px-4 gap-3 z-30">
      <button
        onClick={toggleSidebar}
        className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700 cursor-pointer"
      >
        <Icon name={`${sidebarCollapsed ? 'right' : 'left'}`} className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
            <Icon name='user' className="w-5 h-5" />
            <span className="text-sm hidden sm:block">{user?.username}</span>
          </div>
          <button 
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
          >
            退出
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-1.5 rounded-lg text-sm bg-zinc-900 hover:bg-zinc-700 text-white transition-colors"
        >
          登录
        </button>
      )}
    </header>
  )
}
