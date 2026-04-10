'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: '대시보드', path: '/admin/dashboard', icon: '📊' },
    { name: '게시판 관리', path: '/admin/board', icon: '📝' },
    { name: '팝업 관리', path: '/admin/popup', icon: '🖼️' },
    { name: '통계', path: '/admin/statistics', icon: '📈' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminEmail');
    router.push('/admin/login');
  };

  return (
    <div className={`bg-gray-900 text-white h-screen fixed left-0 top-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {isOpen && <h1 className="text-xl font-bold">루트에너지</h1>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-gray-300"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {isOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl">🚪</span>
            {isOpen && <span>로그아웃</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

