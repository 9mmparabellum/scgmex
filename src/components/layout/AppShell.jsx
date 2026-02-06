import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '../../stores/appStore';

export default function AppShell() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <Header />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
