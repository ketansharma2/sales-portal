'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  // Close dropdown on route change and refresh notifications

  // Determine "View All" link based on current role
  const getViewAllLink = () => {
    if (pathname.startsWith('/admin')) return '/admin/notifications';
    if (pathname.startsWith('/hod')) return '/hod/notifications';
    if (pathname.startsWith('/corporate/manager')) return '/corporate/manager/notifications';
    if (pathname.startsWith('/corporate/fse')) return '/corporate/fse/notifications';
    if (pathname.startsWith('/corporate/leadgen')) return '/corporate/leadgen/notifications';
    if (pathname.startsWith('/corporate/recruiter')) return '/corporate/recruiter/notifications';
    if (pathname.startsWith('/corporate/tl')) return '/corporate/tl/notifications';
    if (pathname.startsWith('/corporate/crm')) return '/domestic/crm/notifications';
    if (pathname.startsWith('/corporate/revenue')) return '/domestic/revenue/notifications';
    if (pathname.startsWith('/domestic/manager')) return '/domestic/manager/notifications';
    if (pathname.startsWith('/domestic/fse')) return '/domestic/fse/notifications';
    if (pathname.startsWith('/domestic/crm')) return '/domestic/crm/notifications';
    if (pathname.startsWith('/domestic/revenue')) return '/domestic/revenue/notifications';
    if (pathname.startsWith('/domestic/leadgen')) return '/domestic/leadgen/notifications';
    if (pathname.startsWith('/domestic/recruiter')) return '/domestic/recruiter/notifications';
    if (pathname.startsWith('/domestic/tl')) return '/domestic/tl/notifications';
    if (pathname.startsWith('/manager')) return '/manager/notifications';
    if (pathname.startsWith('/fse')) return '/fse/notifications';
    if (pathname.startsWith('/operations')) return '/operations/notifications';
    return '/notifications';
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all ${
          isOpen
            ? 'bg-[#103c7f] text-white'
            : 'bg-gray-50 text-[#103c7f] hover:bg-blue-50'
        }`}
      >
        <Bell size={20} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#a1db40] rounded-full border-2 border-white animate-bounce"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-6 pb-3 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest">
              Notifications
            </h3>
            <span className="text-[10px] font-bold text-[#a1db40] bg-[#a1db40]/10 px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-xs">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    setIsOpen(false); // ✅ close dropdown immediately after clicking
                  }}
                  className={`p-4 border-b border-gray-50 flex gap-3 items-start transition-colors cursor-pointer hover:bg-gray-50/80 ${
                    !notif.is_read ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      !notif.is_read ? 'bg-[#a1db40]' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p
                      className={`text-[11px] leading-tight ${
                        !notif.is_read
                          ? 'font-black text-[#103c7f]'
                          : 'font-medium text-gray-400'
                      }`}
                    >
                      {notif.title}
                      {notif.message && (
                        <span className="block text-[10px] font-normal text-gray-500 mt-0.5">
                          {notif.message}
                        </span>
                      )}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1 font-bold">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevents the parent div's onClick
                      deleteNotification(notif.id);
                      // keep dropdown open – user may want to delete multiple
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <Link
            href={getViewAllLink()}
            onClick={() => setIsOpen(false)}
            className="block text-center"
          >
            <button className="w-full pt-3 text-[10px] font-black text-[#103c7f] uppercase tracking-tighter hover:text-[#a1db40] transition-colors">
              View All Notifications
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}