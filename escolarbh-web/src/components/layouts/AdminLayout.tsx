import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin' }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Escolar Allyson</h1>
          <p className="text-sm text-brand-500 font-medium mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                    : 'text-gray-400 hover:bg-[#334155] hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#334155]">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-lg bg-[#334155] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium text-sm flex items-center justify-center"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#1e293b] border-b border-[#334155] flex items-center px-8">
          <h2 className="text-xl font-semibold text-white">Administração</h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
