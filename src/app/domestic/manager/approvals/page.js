"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Check, X, ShieldCheck, UserCircle, Search, Download,
  Clock, FileText, CheckCircle, ArrowRightCircle, Building2, Lock,
  Users, Wallet, CircleDollarSign, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown, RefreshCcw, Filter, XCircle
} from "lucide-react";
import * as API from '@/lib/api-client';
import Image from "next/image";
const DATE_RANGE_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

function KpiCard({ title, total, icon, color, prefix }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  const activeColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="flex items-center gap-3 mb-1">
        <div className={`p-2 rounded-lg ${activeColor} border shrink-0 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
      </div>
      <h3 className="text-xl font-black text-slate-800 leading-none">
        {prefix}{(total || 0).toLocaleString('en-IN')}
      </h3>
    </div>
  );
}

function SortHeader({ label, field, sortBy, sortDir, onSort, center }) {
  const active = sortBy === field;
  return (
    <th
      className={`px-5 py-3.5 cursor-pointer select-none hover:bg-[#0d316a] transition-colors ${center ? "text-center" : ""}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
        ) : (
          <ArrowUpDown size={11} className="opacity-40" />
        )}
      </div>
    </th>
  );
}

export default function ManagerApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kpis, setKpis] = useState({
    totalClaims: 0, pendingClaims: 0, approvedClaims: 0, rejectedClaims: 0, paidClaims: 0,
    totalApprovedValue: 0, pendingAmount: 0, rejectedAmount: 0, activeEmployees: 0,
  });

  // Filters
  const [dateRange, setDateRange] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const isCustomRange = Boolean(customFrom && customTo);
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Sort & pagination
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildParams = useCallback((overrides = {}) => {
    const params = new URLSearchParams();
    if (isCustomRange && customFrom && customTo) {
      params.set("from_date", customFrom);
      params.set("to_date", customTo);
    } else if (dateRange) {
      params.set("date_range", dateRange);
    }
    if (employeeId) params.set("employee_id", employeeId);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (minAmount) params.set("min_amount", minAmount);
    if (maxAmount) params.set("max_amount", maxAmount);
    if (search) params.set("search", search);
    params.set("sort_by", sortBy);
    params.set("sort_dir", sortDir);
    params.set("page", String(overrides.page ?? page));
    params.set("page_size", String(pageSize));
    return params;
  }, [dateRange, isCustomRange, customFrom, customTo, employeeId, category, status, minAmount, maxAmount, search, sortBy, sortDir, page, pageSize]);

  const fetchPendingExpenses = useCallback(async ({ isRefresh = false } = {}) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await API.apiGet('/api/domestic/manager/approvals/pending-expenses');
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
        setEmployees(data.employees || []);
        setCategories(data.categories || []);
        setKpis(data.kpis || kpis);
        setPagination(data.pagination || { page: 1, pageSize, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch pending expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildParams]);

  const fetchTeamCount = async () => {
    try {
      const response = await API.apiGet('/api/manager/fse-team');
      const data = await response.json();
      if (data.success) {
        setTeamCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch team count:', error);
    }
  };

  useEffect(() => {
    fetchPendingExpenses();
  }, [fetchPendingExpenses]);

  useEffect(() => {
    fetchTeamCount();
  }, []);

  const handleApprove = async (exp_id) => {
    try {
      const response = await API.apiPost('/api/domestic/manager/approvals/approve-expense', { exp_id });
      console.log('Response status:', response.status);
      const data = await response.json();
      if (data.success) {
  setApprovals(prev =>
    prev.map(item =>
      item.id === exp_id
        ? { ...item, status: "Approved" }
        : item
    )
  );
}
    
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const handleReject = async (exp_id) => {
    try {
      const response = await API.apiPost('/api/domestic/manager/approvals/reject-expense', { exp_id });
      console.log('Response status:', response.status);
      const data = await response.json();
      if (data.success) {
  setApprovals(prev =>
    prev.map(item =>
      item.id === exp_id
        ? { ...item, status: "Rejected" }
        : item
    )
  );
}
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const handleSendToHR = async (exp_id) => {
    try {
      const response = await API.apiPost('/api/domestic/manager/approvals/send-to-hr', { exp_id });
      const data = await response.json();
        if (data.success) {
      setApprovals(prev =>
        prev.map(item =>
          item.id === exp_id
            ? { ...item, status: "Sent to HR" }
            : item
        )
      );
    }
    } catch (error) {
      console.error('Failed to send to HR:', error);
      alert('Failed to send to HR');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setDateRange("");
    setCustomFrom("");
    setCustomTo("");
    setEmployeeId("");
    setCategory("");
    setStatus("");
    setMinAmount("");
    setMaxAmount("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (dateRange) n++;
    if (isCustomRange) n++;
    if (employeeId) n++;
    if (category) n++;
    if (status) n++;
    if (minAmount) n++;
    if (maxAmount) n++;
    if (search) n++;
    return n;
  }, [dateRange, isCustomRange, employeeId, category, status, minAmount, maxAmount, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = buildParams();
      params.set("export", "true");
      const response = await fetch(`/api/domestic/manager/approvals/pending-expenses?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (!data.success) {
        alert('Failed to generate report');
        return;
      }
      const rows = data.data || [];
      const header = ["Employee", "Role", "Category", "Notes", "Amount", "Date", "Status"];
      const csvRows = rows.map(r => [
        r.name, r.role, r.category, (r.notes || '').replace(/"/g, '""'), r.amount, r.date, r.status
      ]);
      const csvContent = [header, ...csvRows]
        .map(row => row.map(v => `"${String(v ?? '')}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-approvals-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = pagination.totalPages || 1;

  return (
<div className="h-[calc(100vh-4rem)] bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden overflow-y-auto custom-scrollbar">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[16px] p-4 mb-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#103c7f] p-3 rounded-[14px] shadow-lg shadow-[#103c7f]/20">
            <ShieldCheck size={24} className="text-[#a1db40]" strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
              Team Approvals
            </h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1.5 uppercase flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
               {isCustomRange && customFrom && customTo
                 ? "Custom Range"
                 : dateRange ? DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label : "All Time"} Approvals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-[14px] border border-gray-100">
           <div className="flex items-center px-3 gap-2 border-r border-gray-200">
             <Search size={16} className="text-gray-300"/>
             <input
               type="text"
               placeholder="Search FSE, category, notes..."
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               className="bg-transparent text-[10px] font-bold text-[#103c7f] outline-none w-36"
             />
           </div>
           <button
             onClick={() => setShowFilters(v => !v)}
             className={`p-2 rounded-[10px] transition-all relative ${showFilters ? 'bg-[#103c7f] text-[#a1db40]' : 'bg-white text-[#103c7f] border border-gray-200'}`}
             title="Toggle Filters"
           >
             <Filter size={14} />
             {activeFilterCount > 0 && (
               <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                 {activeFilterCount}
               </span>
             )}
           </button>
           <button
             onClick={() => fetchPendingExpenses({ isRefresh: true })}
             className="p-2 rounded-[10px] bg-white text-[#103c7f] border border-gray-200 hover:bg-gray-100 transition-all"
             title="Refresh"
           >
             <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
           </button>
           <button
             onClick={handleExport}
             disabled={exporting}
             className="bg-[#103c7f] text-[#a1db40] px-4 py-2 rounded-[10px] font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-[#0d316a] transition-all disabled:opacity-50"
           >
             <Download size={12} /> {exporting ? "Exporting..." : "Report"}
           </button>
        </div>
      </div>

         {/* KPI DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4 shrink-0">
        <KpiCard title="Total Claims" total={kpis.totalClaims} icon={<FileText size={16} />} color="blue" />
        <KpiCard title="Pending Claims" total={kpis.pendingClaims} icon={<Clock size={16} />} color="orange" />
        <KpiCard title="Approved Claims" total={kpis.approvedClaims} icon={<CheckCircle size={16} />} color="green" />
        <KpiCard title="Rejected Claims" total={kpis.rejectedClaims} icon={<X size={16} />} color="red" />
        <KpiCard title="Paid Claims" total={kpis.paidClaims} icon={<Lock size={16} />} color="teal" />
        <KpiCard title="Total Approved Value" total={kpis.totalApprovedValue} icon={<CircleDollarSign size={16} />} color="green" prefix="₹" />
        <KpiCard title="Pending Amount" total={kpis.pendingAmount} icon={<Wallet size={16} />} color="orange" prefix="₹" />
        <KpiCard title="Rejected Amount" total={kpis.rejectedAmount} icon={<Wallet size={16} />} color="red" prefix="₹" />
        <KpiCard title="Active Employees" total={kpis.activeEmployees} icon={<Users size={16} />} color="indigo" />
      </div>

      {/* FILTER BAR */}
      {showFilters && (
        <div className="bg-white rounded-[16px] p-4 mb-4 shadow-sm border border-gray-100 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date Range</label>
              <select
                value={dateRange}
                disabled={isCustomRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none disabled:opacity-40"
              >
                {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
              <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); if (e.target.value) setDateRange(""); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">End Date</label>
              <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); if (e.target.value) setDateRange(""); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Employee</label>
              <select
                value={employeeId}
                onChange={(e) => { setEmployeeId(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none max-w-[160px]"
              >
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-[#103c7f] outline-none"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

     

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest px-3 py-2 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-all"
              >
                <XCircle size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      )}


      {/* CLAIMS TABLE */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-[420px]">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-[#103c7f] text-white z-10 text-[10px] uppercase font-black tracking-[0.1em]">
              <tr>
                <SortHeader label="Field Executive" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="px-5 py-3.5">Expense Category & Notes</th>
                <SortHeader label="Amount" field="amount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} center />
                <SortHeader label="Date" field="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} center />
                <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} center />
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCcw size={24} className="text-[#103c7f] animate-spin" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading claims...</p>
                    </div>
                  </td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={28} className="text-gray-200" />
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No expense claims found</p>
                      <p className="text-[10px] text-gray-300">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : approvals.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50 transition-all group">

                  {/* Name Column */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${item.img}`}>
                        <UserCircle size={22} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-black text-[#103c7f] text-sm leading-none tracking-tight">{item.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#a1db40]"></span> {item.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Details Column */}
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-700 uppercase tracking-tight text-[11px] mb-0.5">{item.category}</span>
                        <span className="text-[11px] font-bold text-gray-400 italic">{item.notes}</span>
                    </div>
                  </td>

                  {/* Amount Column */}
                  <td className="px-5 py-3 text-center">
                    <p className="text-lg font-black text-[#103c7f] italic leading-none">₹{item.amount}</p>
                  </td>

                  {/* Date Column */}
                  <td className="px-5 py-3 text-center font-black text-gray-400 text-[11px]">
                    {item.date}
                  </td>

                  {/* Status Column */}
                  <td className="px-5 py-3 text-center">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 w-fit mx-auto
                      ${item.status === 'Approved'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        : item.status === 'Clarification Req'
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                          : item.status === 'Sent to HR'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : item.status === 'Rejected'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : item.status === 'PAID'
                                ? 'bg-teal-50 text-teal-600 border-teal-100'
                                : 'bg-orange-50 text-orange-600 border-orange-100'}`}>

                      {item.status === 'Pending Review' && <Clock size={10} />}
                      {item.status === 'Sent to HR' && <Building2 size={10} />}
                      {item.status === 'Approved' && <CheckCircle size={10} />}
                      {item.status === 'Rejected' && <X size={10} />}
                      {item.status === 'PAID' && <Lock size={10} />}
                      {item.status === 'Sent to HR' ? 'Approved' : item.status}
                    </span>
                  </td>

                  {/* Action Column */}
                  <td className="px-5 py-3 text-center">
                    {item.status === "PAID" ? (
                  <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full shadow-sm">
                    <Lock size={14} className="text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                      Payment Completed
                    </span>
                  </div>
                  </div>
                  ): item.status === "Sent to HR" ? (
                      <div className="flex justify-center items-center gap-2 opacity-80">
                         <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1">
    <Building2 size={10} />
    Sent to HR
  </span>

                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    ) : item.status === "Rejected" ? (
                      <div className="flex justify-center items-center gap-2 opacity-80">
                        <X size={16} className="text-red-600" />
                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleSendToHR(item.id)} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Approve">
                          <Check size={16} strokeWidth={3}/>
                        </button>
                        <button onClick={() => handleReject(item.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Reject">
                          <X size={16} strokeWidth={3}/>
                        </button>
                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="bg-gray-100 text-[#103c7f] p-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-all shadow-sm" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="bg-gray-50 p-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-[#103c7f] shrink-0">
           <div className="flex items-center gap-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">My Team: {teamCount} FSEs</p>
              <div className="h-3 w-px bg-gray-300"></div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Showing {approvals.length} of {pagination.total} Claims
              </p>
           </div>

           <div className="flex items-center gap-3">
             <button
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page <= 1}
               className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100 transition-all"
             >
               <ChevronLeft size={14} />
             </button>
             <p className="text-[10px] font-black uppercase tracking-widest">Page {pagination.page} / {totalPages}</p>
             <button
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page >= totalPages}
               className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100 transition-all"
             >
               <ChevronRight size={14} />
             </button>
           </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Calibri'] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-4xl w-full p-8 relative overflow-hidden">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-5 mb-6">
              <div className="bg-[#103c7f]/5 w-16 h-16 rounded-2xl flex items-center justify-center text-[#103c7f] border border-[#103c7f]/10 shrink-0">
                <FileText size={30} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
                  Bill Preview
                </h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
                  Expense Proof Document
                </p>
              </div>
            </div>
            <div className="flex justify-center">
  {previewUrl ? (
    <Image
      src={previewUrl}
      alt="Bill Preview"
      width={800}
      height={1000}
      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
    />
  ) : (
    <div className="text-center text-gray-500 py-10">
      No bill available
    </div>
  )}
</div>
          </div>
        </div>
      )}
    </div>
  );
}
