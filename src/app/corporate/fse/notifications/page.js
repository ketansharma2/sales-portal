"use client";
import { useState } from "react";
import { 
  Bell, CheckCircle2, Clock, Trash2, 
  ArrowLeft, MailOpen, Filter, Inbox
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("All");

  // Mock Notifications Data - Inhe aap future mein API se connect kar sakte hain
  const [notifications, setNotifications] = useState([
    { id: 1, type: "Expense", text: "Your Travel Expense for Delhi trip was Approved", time: "2 mins ago", unread: true },
    { id: 2, type: "Leads", text: "New High-Priority Lead assigned: Rahul Sharma", time: "1 hour ago", unread: true },
    { id: 3, type: "System", text: "Welcome to the new Maven Jobs Portal!", time: "2 days ago", unread: false },
    { id: 4, type: "Expense", text: "Manager commented on your Stay claim", time: "5 hours ago", unread: false },
    { id: 5, type: "Leads", text: "Follow-up reminder for Lead: Tech Corp", time: "1 day ago", unread: false },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotif = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Filter Logic
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return n.unread;
    return n.type === activeTab;
  });

  return (
    <div className="flex flex-col h-full font-['Calibri'] w-full">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
             {/* --- UPDATED BACK NAVIGATION: Ab ye Dashboard (Home) par jayega --- */}
<Link 
  href="/fse" 
  className="text-gray-400 hover:text-[#103c7f] transition-all flex items-center gap-1 group"
>
  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
  {/* Text ko bhi 'Back to Home' ya 'Dashboard' kar dein taaki user ko clear rahe */}
  <span className="text-[10px] font-black uppercase tracking-widest">Back to Home</span>
</Link>
          </div>
          <h1 className="text-4xl font-black text-[#103c7f] tracking-tight uppercase italic">
            Notifications
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse"></span> 
            FSE Personal Inbox
          </p>
        </div>

        <button 
          onClick={markAllRead}
          className="flex items-center gap-2 bg-white border border-gray-100 text-[#103c7f] px-6 py-3 rounded-2xl font-black text-xs uppercase hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <MailOpen size={16} /> Mark All as Read
        </button>
      </div>

      {/* --- FILTER TABS --- */}
      <div className="flex gap-3 mb-6">
        {["All", "Unread", "Expense", "Leads"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTab === tab 
              ? "bg-[#103c7f] text-white border-[#103c7f] shadow-lg shadow-[#103c7f]/20" 
              : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- NOTIFICATIONS LIST CONTAINER --- */}
      <div className="bg-white shadow-sm rounded-[32px] border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group ${
                    n.unread ? "bg-blue-50/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-5">
                    {/* Status Indicator Dot */}
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      n.unread ? "bg-[#a1db40] shadow-[0_0_8px_rgba(161,219,64,0.6)]" : "bg-gray-200"
                    }`}></div>
                    
                    <div>
                      <p className={`text-sm tracking-tight ${
                        n.unread ? "font-black text-[#103c7f]" : "font-bold text-gray-500"
                      }`}>
                        {n.text}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                        <span className="flex items-center gap-1"><Clock size={12} /> {n.time}</span>
                        <span>•</span>
                        <span className="text-[#103c7f]/40">{n.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => deleteNotif(n.id)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Notification"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State UI */
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 py-20">
              <div className="bg-gray-50 p-8 rounded-[40px]">
                <Inbox size={64} strokeWidth={1} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-black italic text-lg uppercase tracking-tight">No notifications</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Your inbox is clear for now</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}