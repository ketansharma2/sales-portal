"use client";
import { useState, useEffect } from "react";
import { 
  Calendar, X, Search, Loader2, CalendarOff, Trash2, 
  ChevronLeft, ChevronRight
} from "lucide-react";

export default function NonVisitDaysPage() {
  const [mounted, setMounted] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Handle month filter selection
  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  }, [selectedMonth]);

  // Fetch leaves when mounted or date filters change
  useEffect(() => {
    if (mounted) fetchLeaves();
  }, [mounted, fromDate, toDate]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      let url = '/api/domestic/fse/non-working';
      if (fromDate && toDate) {
        url += `?fromDate=${fromDate}&toDate=${toDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLeave = async (leave) => {
    const confirmed = confirm(`Are you sure you want to delete this non-visit day entry?\n\nDate: ${leave.date}\nReason: ${leave.reason}`);
    if (!confirmed) return;

    try {
      setSaving(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      const response = await fetch(`/api/domestic/fse/non-working?id=${leave.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Entry deleted successfully');
        fetchLeaves();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete'));
      }
    } catch (error) {
      alert('Error deleting entry');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const fullDayCount = leaves.filter(l => l.leave_type === 'Full Day').length;
  const halfDayCount = leaves.filter(l => l.leave_type === 'Half Day').length;

  if (!mounted) return null;

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden font-['Calibri'] p-1 md:p-2 bg-[#f8fafc]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
          <h1 className="text-2xl md:text-3xl font-black text-[#103c7f] uppercase italic tracking-tight whitespace-nowrap shrink-0">
            Non-Visit Days
          </h1>
          <span className="bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            {leaves.length} Entries
          </span>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-sm gap-2">
          {/* Month Filter */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[130px] px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-1 focus:ring-blue-100 cursor-pointer"
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const value = d.toISOString().slice(0, 7);
              const label = d.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>

          <div className="relative flex items-center">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[120px] px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-1 focus:ring-blue-100 cursor-pointer"
            />
          </div>
          <span className="text-gray-300 font-bold text-xs">-</span>
          <div className="relative flex items-center">
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-[120px] px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-1 focus:ring-blue-100 cursor-pointer"
            />
          </div>
          {(fromDate || toDate) && (
            <button 
              onClick={() => { setFromDate(''); setToDate(''); setSelectedMonth(''); }}
              className="p-1 hover:bg-red-50 text-red-400 rounded-full transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Full Day</p>
          <p className="text-2xl font-black text-orange-600">{fullDayCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Half Day</p>
          <p className="text-2xl font-black text-blue-600">{halfDayCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Days</p>
          <p className="text-2xl font-black text-gray-700">{leaves.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 flex-1 overflow-hidden shadow-sm rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#103c7f]" size={32} />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CalendarOff size={40} className="mb-2" />
            <p className="font-bold">No non-visit days found</p>
          </div>
        ) : (
          <div className="overflow-auto h-full custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#103c7f] text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((leave, index) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-400 font-bold">{index + 1}</td>
                    <td className="p-3 font-bold text-[#103c7f]">{leave.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded font-bold text-[10px] uppercase ${
                        leave.leave_type === 'Full Day' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {leave.leave_type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{leave.reason}</td>
                    <td className="p-3 text-gray-500 text-[11px]">{leave.remarks || '-'}</td>
                    <td className="p-3 text-gray-400">
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteLeave(leave)}
                        disabled={saving}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}