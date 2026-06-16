"use client";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowLeft,
  MailOpen,
  Filter,
  Inbox,
  X,
  Info,
  Tag,
  CalendarClock,
  User,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

function getInitials(name) {
  return name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";
}

export default function NotificationsPageSection({ backHref = "/", roleLabel = "Inbox" }) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [errorMessage, setErrorMessage] = useState(null);

  const { notifications, unreadCount, loading, error, markAsRead, deleteNotification, refresh } =
    useNotifications();

  const displayedNotifications =
    activeTab === "All"
      ? notifications
      : activeTab === "Unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const markAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    setProcessingIds(new Set(unreadNotifications.map(n => n.id)));
    try {
      await Promise.all(
        unreadNotifications.map(async (n) => {
          try {
            await markAsRead(n.id);
          } catch (err) {
            console.error(`Failed to mark notification ${n.id} as read:`, err);
          }
        })
      );
      // Refresh notifications after batch operation
      await refresh();
    } catch (error) {
      console.error("Error marking all as read:", error);
      setErrorMessage("Failed to mark all as read");
    } finally {
      setProcessingIds(new Set());
    }
  };

  const handleRowClick = async (notif) => {
    // If already processing this notification or already selected, just toggle
    if (processingIds.has(notif.id)) return;
    
    // If it's the same notification, just toggle selection without API call
    if (selectedId === notif.id) {
      setSelectedId(null);
      return;
    }

    // Mark as read if unread
    if (!notif.is_read) {
      setProcessingIds(prev => new Set(prev).add(notif.id));
      try {
        await markAsRead(notif.id);
        // Refresh to get updated notification
        await refresh();
        setSelectedId(notif.id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        setErrorMessage("Failed to mark notification as read");
        // Still open the detail view even if marking as read fails
        setSelectedId(notif.id);
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notif.id);
          return newSet;
        });
      }
    } else {
      // If already read, just open detail
      setSelectedId(notif.id);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    
    // Don't allow deletion if already processing
    if (processingIds.has(notificationId)) return;
    
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await deleteNotification(notificationId);
      if (selectedId === notificationId) {
        setSelectedId(null);
      }
      // Refresh notifications
      await refresh();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setErrorMessage("Failed to delete notification");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const entityPreview = (type) => {
    const map = {
      lead: "Lead",
      expense: "Expense",
      approval: "Approval",
      package: "Package",
      recruitment: "Recruitment",
      leave: "Leave",
      target: "Target",
      team_lead: "Team Lead",
      revenue: "Revenue",
      user: "User",
      report: "Report",
    };
    return map[type] || type || "Notification";
  };

  return (
    <div className="flex flex-col h-full font-['Calibri'] w-full">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 lg:px-8">
        {/* Error message display */}
        {(error || errorMessage) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-between">
            <span>{error || errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-end mb-8 shrink-0 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={backHref}
                className="text-gray-400 hover:text-[#103c7f] transition-all flex items-center gap-1 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Home</span>
              </Link>
            </div>
            <h1 className="text-4xl font-black text-[#103c7f] tracking-tight uppercase italic">
              Notifications
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse"></span>
              {roleLabel}
            </p>
          </div>

          <button
            onClick={markAllRead}
            disabled={!notifications.some((n) => !n.is_read) || processingIds.size > 0}
            className="flex items-center gap-2 bg-white border border-gray-100 text-[#103c7f] px-6 py-3 rounded-2xl font-black text-xs uppercase hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <MailOpen size={16} /> 
            {processingIds.size > 0 ? "Processing..." : "Mark All as Read"}
          </button>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {["All", "Unread", "Expense", "Leads", "Approval", "Recruitment", "Leave", "Target"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedId(null); // Clear selected notification when switching tabs
                }}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#103c7f] text-white border-[#103c7f] shadow-lg shadow-[#103c7f]/20"
                    : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="bg-white shadow-sm rounded-[32px] border border-gray-100 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-20">
              <Bell className="animate-bounce" size={32} />
              <p className="text-xs font-black uppercase tracking-widest">Loading notifications…</p>
            </div>
          ) : error && !errorMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 gap-3 py-20">
              <p className="text-sm font-black">{error}</p>
              <button 
                onClick={() => refresh()}
                className="px-4 py-2 bg-[#103c7f] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0c2d5e]"
              >
                Retry
              </button>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 py-20">
              <div className="bg-gray-50 p-8 rounded-[40px]">
                <Inbox size={64} strokeWidth={1} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-black italic text-lg uppercase tracking-tight">No notifications</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">
                  Your inbox is clear for now
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="divide-y divide-gray-50">
                {displayedNotifications.map((n) => {
                  const isSelected = selectedId === n.id;
                  const detailOpen = isSelected;
                  const isProcessing = processingIds.has(n.id);
                  
                  return (
                    <div key={n.id}>
                      <div
                        onClick={() => handleRowClick(n)}
                        className={`p-5 flex items-center justify-between transition-all group cursor-pointer ${
                          !n.is_read ? "bg-blue-50/30" : "bg-white"
                        } ${detailOpen ? "bg-blue-50/60" : ""} ${
                          isProcessing ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                              n.is_read ? "bg-gray-200" : "bg-[#a1db40] shadow-[0_0_8px_rgba(161,219,64,0.6)]"
                            }`}
                          ></div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {n.entity_type && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#103c7f]/60 bg-[#103c7f]/5 px-2 py-0.5 rounded-full border border-[#103c7f]/10">
                                  <Tag size={10} /> {entityPreview(n.entity_type)}
                                </span>
                              )}
                              {!n.is_read && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#a1db40] bg-[#a1db40]/10 px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm tracking-tight leading-snug ${
                                !n.is_read ? "font-black text-[#103c7f]" : "font-bold text-gray-600"
                              }`}
                            >
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={(e) => handleDelete(e, n.id)}
                            className={`p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${
                              isProcessing ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Delete Notification"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#103c7f] rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {detailOpen && (
                        <div className="bg-gray-50/80 border-t border-b border-gray-100 animate-in fade-in slide-in-from-top-1">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> Notification Detail
                              </h3>
                              <button
                                onClick={() => setSelectedId(null)}
                                className="text-gray-400 hover:text-[#103c7f] transition-colors"
                                title="Close detail"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                      Title
                                    </p>
                                    <p className="text-sm font-black text-[#103c7f] leading-snug">
                                      {n.title}
                                    </p>
                                  </div>

                                  {n.message && (
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                        Message
                                      </p>
                                      <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50 rounded-xl p-3">
                                        {n.message}
                                      </p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                        <CalendarClock size={10} /> Created At
                                      </p>
                                      <p className="text-xs font-bold text-gray-700">
                                        {new Date(n.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    {n.read_at && (
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                          <CheckCircle2 size={10} /> Read At
                                        </p>
                                        <p className="text-xs font-bold text-gray-700">
                                          {new Date(n.read_at).toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                    {n.entity_type && (
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                          <Tag size={10} /> Entity Type
                                        </p>
                                        <p className="text-xs font-bold text-gray-700">
                                          {n.entity_type}
                                        </p>
                                      </div>
                                    )}
                                    {n.entity_id && (
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                          <Hash size={10} /> Entity ID
                                        </p>
                                        <p className="text-xs font-bold text-gray-700 font-mono">
                                          {n.entity_id}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                        <User size={10} /> Status
                                      </p>
                                      <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                          n.is_read
                                            ? "text-gray-600 bg-gray-100"
                                            : "text-[#a1db40] bg-[#a1db40]/10"
                                        }`}
                                      >
                                        {n.is_read ? "Read" : "Unread"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}