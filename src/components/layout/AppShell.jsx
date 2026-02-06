import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/Toast';
import { useAppStore } from '../../stores/appStore';

export default function AppShell() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Sidebar stays mounted -- uses CSS transform to slide */}
      <Sidebar />

      {/* Content wrapper -- margin syncs with sidebar animation */}
      <div
        className={`
          min-h-screen flex flex-col
          transition-[margin] duration-300 ease-in-out
          ${sidebarOpen ? 'ml-[260px]' : 'ml-0'}
        `}
      >
        <Header />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
