"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Building2, Phone, FileText, Send, CheckCircle,
  MapPin, Calendar, Clock, Filter, Award, Search, Eye,
  Mail, Users, TrendingUp, AlertCircle, RefreshCw, Briefcase, Edit, Trash2, X
} from "lucide-react";

export default function AdminFranchiseDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // --- MODAL STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState("");
  const [interactions, setInteractions] = useState([]);
  const [editingInteractionId, setEditingInteractionId] = useState(null);
  const [interactionData, setInteractionData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: '',
    sub_status: '',
    remarks: '',
    next_follow_up: '',
    contact_person: '',
    contact_no: '',
    email: '',
    franchise_status: ''
  });

  // --- FILTERS ---
  const [statusFilter, setStatusFilter] = useState("All");
  const [franchiseStatusFilter, setFranchiseStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --- DATA ---
  const [pipeline, setPipeline] = useState({
    discussed: 0,
    formAsk: 0,
    formShared: 0,
    accepted: 0
  });
  const [franchiseLeads, setFranchiseLeads] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    by_status: {},
    by_franchise_status: {},
    by_leadgen: {},
    by_leadgen_name: {}
  });

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAuthHeaders = useCallback(() => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    } catch (e) {
      return { 'Content-Type': 'application/json' };
    }
  }, []);

  const fetchPipelineCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
        params.append('dateRange', 'specific');
      } else {
        params.append('dateRange', 'all');
      }

      const [discussedRes, formAskRes, formSharedRes, acceptedRes] = await Promise.all([
        fetch(`/api/admin/franchise/franchise-discussed?${params.toString()}`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/admin/franchise/franchise-count?${params.toString()}&status=application form share`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/admin/franchise/franchise-count?${params.toString()}&status=application form share`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/admin/franchise/franchise-accepted?${params.toString()}`, {
          headers: getAuthHeaders()
        }),
      ]);

      const discussedData = await discussedRes.json();
      const formAskData = await formAskRes.json();
      const formSharedData = await formSharedRes.json();
      const acceptedData = await acceptedRes.json();

      setPipeline({
        discussed: discussedData.success ? discussedData.data?.franchise?.total || 0 : 0,
        formAsk: (formAskData.success ? formAskData.data?.franchise?.total || 0 : 0),
        formShared: (formSharedData.success ? formSharedData.data?.franchise?.total || 0 : 0),
        accepted: acceptedData.success ? acceptedData.data?.franchiseAccepted?.total || 0 : 0,
      });
    } catch (error) {
      console.error('Failed to fetch pipeline counts:', error);
    }
  }, [fromDate, toDate, getAuthHeaders]);

  const fetchInteractions = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/admin/franchise/interaction?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setInteractions(data.data || []);
      } else {
        setInteractions([]);
        console.error('Failed to fetch interactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
      setInteractions([]);
    }
  };

  const handleAction = (lead, type) => {
    if (type === 'view') {
      setSelectedLead(lead);
      setModalType('view');
      setIsFormOpen(true);
      fetchInteractions(lead.client_id);
    }
  };

  const fetchFranchiseLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/admin/franchise/leads-with-interactions?page=${currentPage}&pageSize=${pageSize}`;

      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      if (franchiseStatusFilter && franchiseStatusFilter !== 'All') params.append('franchise_status', franchiseStatusFilter);

      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`${url}${params.toString() ? '&' + params.toString() : ''}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
     
      console.log("data",data);
      if (data.success) {
        setFranchiseLeads(data.data || []);
        setSummary(data.summary || {
          total: 0,
          by_status: {},
          by_franchise_status: {},
          by_leadgen: {},
          by_leadgen_name: {}
        });
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Failed to fetch franchise leads:', error);
      setError(error.message);
      setFranchiseLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, fromDate, toDate, statusFilter, franchiseStatusFilter, getAuthHeaders]);

  useEffect(() => {
    fetchPipelineCounts();
  }, [fetchPipelineCounts]);

  useEffect(() => {
    fetchFranchiseLeads();
  }, [fetchFranchiseLeads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPipelineCounts(), fetchFranchiseLeads()]);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Hot': 'bg-red-100 text-red-800 border-red-200',
      'Warm': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cold': 'bg-blue-100 text-blue-800 border-blue-200',
      'Converted': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-gray-100 text-gray-800 border-gray-200',
      'Discussed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Form Ask': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Form Shared': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Accepted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getFranchiseStatusColor = (status) => {
    const colors = {
      'Interested': 'bg-green-100 text-green-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Discussed': 'bg-blue-100 text-blue-800',
      'Proposal Sent': 'bg-purple-100 text-purple-800',
      'Follow-up Scheduled': 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (!mounted) return null;

  const filteredLeads = franchiseLeads.filter(lead => {
    const matchesSearch = !searchQuery ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.leadgen_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (lead.latest_interaction?.status ?? 'No Status') === statusFilter;
    const matchesFranchiseStatus = franchiseStatusFilter === 'All' || lead.latest_interaction?.franchise_status === franchiseStatusFilter;
    return matchesSearch && matchesStatus && matchesFranchiseStatus;
  });

  const totalPages = Math.max(1, Math.ceil(summary.total / pageSize));

  return (
    <>
      <div className="p-2 md:p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col">
        <div className="max-w-8xl mx-auto w-full space-y-4">

          {/* ============================================ */}
          {/* HEADER & CONTROLS                            */}
          {/* ============================================ */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Award size={20} /> Franchise Pipeline Overview
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin View (Sourced Leads with Interactions)</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 focus-within:border-blue-400 transition-colors w-48">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Date Filters */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
                <span className="text-[10px] font-bold text-gray-400 uppercase">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase w-28"
                />
              </div>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
                <span className="text-[10px] font-bold text-gray-400 uppercase">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase w-28"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 bg-[#103c7f] hover:bg-[#0d2a5c] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} />
              <span className="text-xs font-bold">Error: {error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#103c7f] mb-4"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Franchise Data...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 space-y-4">

              {/* ============================================ */}
              {/* KPI ROW: FRANCHISE PIPELINE                  */}
              {/* ============================================ */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard title="Discussed" total={pipeline.discussed} icon={<Phone size={18} />} color="teal" />
                  <KpiCard title="Form Ask" total={pipeline.formAsk} icon={<FileText size={18} />} color="teal" />
                  <KpiCard title="Form Shared" total={pipeline.formShared} icon={<Send size={18} />} color="teal" />
                  <KpiCard title="Accepted" total={pipeline.accepted} icon={<CheckCircle size={18} />} color="teal" />
                </div>
              </div>

              {/* ============================================ */}
              {/* DATA TABLE: FRANCHISE LEADS                   */}
              {/* ============================================ */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> Sourced Franchise Leads
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                      Showing {filteredLeads.length} of {summary.total} total
                    </span>
                    {searchQuery && (
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                        Filtered
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-sm bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">#</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">LeadGen</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Company</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Location</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Contact</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Latest Interaction</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Franchise Status</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 whitespace-nowrap">Next Follow-up</th>
                        <th className="px-4 py-3 text-[9px] uppercase font-black text-gray-500 border-b border-gray-200 bg-slate-50 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle size={24} className="text-gray-300" />
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                No franchise leads found
                              </p>
                              {searchQuery && (
                                <p className="text-[10px] text-gray-400">
                                  Try adjusting your filters
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead, idx) => (
                          <tr key={lead.client_id || idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-3 border-b border-gray-50">
                              <span className="text-[10px] font-bold text-gray-400">
                                {(currentPage - 1) * pageSize + idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#103c7f]/10 flex items-center justify-center">
                                  <span className="text-[9px] font-black text-[#103c7f]">
                                    {(lead.leadgen_name || 'N/A').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-700">
                                  {lead.leadgen_name || 'Unassigned'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50">
                              <p className="font-bold text-[11px] text-slate-800 truncate max-w-[150px]" title={lead.company}>
                                {lead.company || 'N/A'}
                              </p>
                              <p className="text-[9px] font-semibold text-gray-400">
                                {lead.category || 'N/A'}
                              </p>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50">
                              <div className="flex items-center gap-1">
                                <MapPin size={10} className="text-red-400 flex-shrink-0" />
                                <span className="text-[9px] font-semibold text-gray-600 truncate max-w-[100px]" title={lead.district_city}>
                                  {lead.district_city || 'N/A'}
                                </span>
                              </div>
                              {lead.state && (
                                <span className="text-[8px] font-bold text-gray-400 uppercase">
                                  {lead.state}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Users size={10} className="text-blue-400 flex-shrink-0" />
                                  <span className="text-[9px] font-bold text-slate-600 truncate" title={lead.latest_interaction?.contact_person}>
                                    {lead.latest_interaction?.contact_person || 'N/A'}
                                  </span>
                                </div>
                                {lead.latest_interaction?.contact_no && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={10} className="text-green-400 flex-shrink-0" />
                                    <span className="text-[8px] font-semibold text-gray-500">
                                      {lead.latest_interaction.contact_no}
                                    </span>
                                  </div>
                                )}
                                {lead.latest_interaction?.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail size={10} className="text-purple-400 flex-shrink-0" />
                                    <span className="text-[8px] font-semibold text-gray-500 truncate" title={lead.latest_interaction.email}>
                                      {lead.latest_interaction.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50">
                              <span
                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight whitespace-nowrap border max-w-[120px] inline-block overflow-hidden text-ellipsis ${getStatusColor(lead.latest_interaction?.status)}`}
                                title={lead.latest_interaction?.remarks || 'No Status'}
                              >
                                {lead.latest_interaction?.remarks || 'No Status'}
                              </span>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50 text-center">
                              {lead.latest_interaction?.franchise_status ? (
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight whitespace-nowrap ${getFranchiseStatusColor(lead.latest_interaction.franchise_status)} border`}>
                                  {lead.latest_interaction.franchise_status}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-300">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50 text-center">
                              {lead.latest_interaction?.next_follow_up ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar size={10} className="text-amber-400" />
                                  <span className="text-[9px] font-bold text-slate-600">
                                    {new Date(lead.latest_interaction.next_follow_up).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-300">Not Set</span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-50 text-center w-[180px]">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleAction(lead, 'view')}
                                  className="p-2 w-20 flex items-center justify-center bg-[#103c7f]/10 hover:bg-[#103c7f]/20 rounded-lg transition-colors"
                                >
                                  <Eye size={16} className="text-[#103c7f]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {summary.total > pageSize && (
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                      Page {currentPage} of {totalPages} ({summary.total} total leads)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-[#103c7f] border border-[#103c7f] rounded-lg text-[10px] font-bold text-white hover:bg-[#0d2a5c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* VIEW MODAL - Moved outside main div */}
      {/* ============================================ */}
      {isFormOpen && modalType === 'view' && selectedLead && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wide">Lead Details</h3>
                {selectedLead && (
                  <p className="text-xs opacity-70 font-mono mt-1">{selectedLead.company}</p>
                )}
              </div>
              <button onClick={() => { setIsFormOpen(false); setInteractions([]); setSelectedLead(null); }} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col h-full font-['Calibri']">
                
                {/* 1. HEADER: DETAILED COMPANY PROFILE */}
                <div className="bg-gray-50 border-b border-gray-200 p-5 rounded-lg">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="shrink-0 min-w-[200px]">
                      <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none truncate max-w-[250px]" title={selectedLead.company}>
                        {selectedLead.company}
                      </h2>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Profile</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          (selectedLead?.startup === true || String(selectedLead?.startup).toLowerCase() === 'yes')
                            ? 'bg-orange-50 text-orange-700 border-orange-100' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          Startup: {selectedLead?.startup || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="h-10 w-px bg-gray-300 shrink-0"></div>

                    <div className="flex items-center gap-8 flex-1 overflow-x-auto pb-1 flex-wrap">
                      <div className="flex flex-col min-w-fit">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced Date</label>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <Calendar size={13} className="text-gray-500 shrink-0"/>
                          <span className="font-mono">{selectedLead?.
sourcing_date
 || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-w-fit">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                        <span className="bg-blue-100 text-[#103c7f] text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200 uppercase w-fit">
                          {selectedLead.category || 'General'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col min-w-fit max-w-[150px]">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</label>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <MapPin size={13} className="text-orange-500 shrink-0"/>
                          <span className="truncate" title={selectedLead.location}>{selectedLead.location || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-w-fit">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / State</label>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <MapPin size={13} className="text-blue-500 shrink-0"/>
                          <span className="truncate">{selectedLead.district_city ? `${selectedLead.district_city}, ` : ''}{selectedLead.state}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col min-w-fit">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</label>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <Users size={13} className="text-green-600 shrink-0"/>
                          <span>{selectedLead.emp_count || '0'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-w-fit max-w-[120px]">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reference</label>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                          <Briefcase size={13} className="text-purple-500 shrink-0"/> 
                          <span className="truncate" title={selectedLead.reference}>{selectedLead.reference || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. INTERACTION HISTORY */}
                <div className="flex-1 overflow-hidden flex flex-col bg-white mt-4">
                  <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Interaction History
                      </h4>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 custom-scrollbar max-h-[400px]">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 shadow-sm border-b border-gray-100">
                          <tr>
                            <th className="p-4">Follow-up Date</th>
                            <th className="p-4">Contact Details</th>
                            <th className="p-4 w-1/4">Remarks</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Franchise</th>
                            <th className="p-4 text-center">Next Follow-up</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-gray-50">
                          {interactions.length > 0 ? interactions.map((interaction, index) => (
                            <tr key={index} className="hover:bg-blue-50/30 transition duration-150 group">
                              <td className="p-4">
                                <div className="font-bold text-[#103c7f] text-sm">
                                  {interaction.date ? new Date(interaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">{interaction.date ? new Date(interaction.date).getFullYear() : ''}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {interaction.contact_person ? interaction.contact_person.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="font-bold text-gray-800">{interaction.contact_person || 'N/A'}</div>
                                    <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                                      {interaction.contact_no && <span className="flex items-center gap-1"><Phone size={10} className="text-gray-400"/> {interaction.contact_no}</span>}
                                      {interaction.email && <span className="text-blue-500 lowercase truncate max-w-[140px]">{interaction.email}</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white transition line-clamp-2" title={interaction.remarks}>
                                  "{interaction.remarks || 'No remarks'}"
                                </p>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-bold min-w-[80px] ${interaction.status === 'Interested' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                                  {interaction.status}
                                  <span className="text-[8px] opacity-70 font-normal">{interaction.sub_status}</span>
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {interaction.franchise_status || 'N/A'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100 inline-block">
                                  {interaction.next_follow_up ? new Date(interaction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                                No interactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                       </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button onClick={() => { setIsFormOpen(false); setInteractions([]); setSelectedLead(null); }} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* --- REUSABLE COMPONENTS --- */

function KpiCard({ title, total, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const activeColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
      <div className="flex items-center gap-3 mb-1">
        <div className={`p-2 rounded-lg ${activeColor} border shrink-0 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <h3 className="text-xl font-black text-slate-800 leading-none">
        {total.toLocaleString()}
      </h3>
    </div>
  );
}