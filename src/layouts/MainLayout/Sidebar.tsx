import Icon from '@/lib/icon';
import { useMenuStore } from '@/stores/useMenuStore';
import { NavLink, useLocation } from 'react-router';


const navItems = [
  { id: 'home', label: '首页', path: '/', icon: 'home' },
  { id: 'text', label: '文本工具', path: '/text', icon: 'text' },
  { id: 'time', label: '时间工具', path: '/time', icon: 'time' },
  { id: 'image', label: '图片工具', path: '/image', icon: 'image' },
  { id: 'json', label: 'JSON 工具', path: '/json', icon: 'json' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { sidebarCollapsed } = useMenuStore();
  const location = useLocation();
  return (
    <div className="flex flex-col h-full">
      {/*  brand区域 */}
      <div className={`flex items-center h-16 gap-3 px-4 border-b border-border ${sidebarCollapsed && !onClose ? 'justify-center' : ''}`}>
        <NavLink to="/" className="flex items-center justify-center gap-4 hover:scale-105 transition-transform duration-150 cursor-pointer">
          <Icon
            name='icon'
            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}
          />
          <h1 className={`text-lg font-bold mt-1 ${sidebarCollapsed && !onClose ? 'sr-only' : ''}`} >Plank工盒</h1>
        </NavLink>
      </div>
      {/* 导航区域 */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return(
            <NavLink 
              key={item.id}
              to={item.path}
              // onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative
                ${isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }
                ${sidebarCollapsed && !onClose ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed && !onClose ? item.label : undefined}
            >
              <Icon name={item.icon} className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span className={`text-sm font-medium group-hover:translate-x-1 transition-transform duration-150 ${sidebarCollapsed && !onClose ? 'sr-only' : ''}`}>{item.label}</span>
            </NavLink>
          )
        })

        }
      </nav>
      {/* 设置 */}
      <NavLink to='/settings' className={`flex items-center gap-3 px-4 py-4 transition-all duration-150 group relative border-t cursor-pointer
        ${sidebarCollapsed && !onClose ? 'justify-center' : ''}
      `}>
        <Icon name='settings' className='w-6 h-6 flex-shrink-0 text-zinc-500 ' />
        <span className={`text-sm font-medium group-hover:translate-x-1 transition-transform duration-150 ${sidebarCollapsed && !onClose ? 'sr-only' : ''}`}>设置</span>
      </NavLink>
    </div>
  )
}

