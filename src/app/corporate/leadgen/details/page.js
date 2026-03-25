"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Phone, Filter, X, Plus, Eye,
  Calendar, MapPin, ListFilter, ArrowRight, Send, Lock, Edit, Award, Users, Briefcase, ArrowLeft
} from "lucide-react";

function DetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get filter params from URL
  const statusFilter = searchParams.get('status') || 'All';
  const subStatusFilter = searchParams.get('subStatus') || 'All';
  const franchiseStatusFilter = searchParams.get('franchiseStatus') || 'All';
  const fromDateFilter = searchParams.get('fromDate') || '';
  const toDateFilter = searchParams.get('toDate') || '';
  const startupFilter = searchParams.get('startup') || 'All';
  const isSubmittedFilter = searchParams.get('isSubmitted') || '';

  // Get filter title for display
  const getFilterTitle = () => {
    if (isSubmittedFilter === 'true') return 'Sent to Manager';
    if (statusFilter && statusFilter !== 'All') return `Status: ${statusFilter}`;
    if (subStatusFilter && subStatusFilter !== 'All') return `Sub-Status: ${subStatusFilter}`;
    if (franchiseStatusFilter && franchiseStatusFilter !== 'All') return `Franchise: ${franchiseStatusFilter}`;
    return 'All Records';
  };

  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState("");
  const [managerName, setManagerName] = useState("Manager");

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

  const [editingInteractionId, setEditingInteractionId] = useState(null);
  const [suggestions, setSuggestions] = useState({ persons: [], nos: [], emails: [] });

  // Format date for display
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  // Format date for comparison
  const formatDateForCompare = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (parts) {
      return new Date(Date.UTC(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3])));
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? null : parsed;
  };

  // Fetch all interactions (not just unique clients) for status filtering
  const fetchInteractions = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      // Build query params
      const params = new URLSearchParams();
      if (fromDateFilter && toDateFilter) {
        params.append('fromDate', fromDateFilter);
        params.append('toDate', toDateFilter);
      }
      if (statusFilter && statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      if (subStatusFilter && subStatusFilter !== 'All') {
        params.append('subStatus', subStatusFilter);
      }
      if (franchiseStatusFilter && franchiseStatusFilter !== 'All') {
        params.append('franchiseStatus', franchiseStatusFilter);
      }
      if (startupFilter && startupFilter !== 'All') {
        params.append('startup', startupFilter);
      }
      if (isSubmittedFilter && isSubmittedFilter !== '') {
        params.append('isSubmitted', isSubmittedFilter);
      }
      
      const queryString = params.toString();
      const response = await fetch(`/api/corporate/leadgen/all-interactions${queryString ? '?' + queryString : ''}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInteractions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single lead interactions for view modal
  const fetchLeadInteractions = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/corporate/leadgen/interaction?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInteractions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
    }
  };

  // Fetch manager name
  const fetchManagerName = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/leadgen/send-to-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ client_id: 0 })
      });
      const data = await response.json();
      if (data.success && data.data?.managerName) {
        setManagerName(data.data.managerName);
      }
    } catch (error) {
      console.error('Failed to fetch manager name:', error);
    }
  };

  // Fetch suggestions when adding interaction
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!selectedLead?.client_id || modalType !== 'add') return;
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch(`/api/corporate/leadgen/interaction?client_id=${selectedLead.client_id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          const persons = [...new Set(data.data.map(i => i.contact_person).filter(Boolean))];
          const nos = [...new Set(data.data.map(i => i.contact_no).filter(Boolean))];
          const emails = [...new Set(data.data.map(i => i.email).filter(Boolean))];
          setSuggestions({ persons, nos, emails });
        }
      } catch (error) {
        console.error('Failed to fetch suggestions');
      }
    };
    fetchSuggestions();
  }, [selectedLead, modalType]);

  // Initial fetch
  useEffect(() => {
    fetchInteractions();
    fetchManagerName();
  }, []);

  // Apply filters when filter params change
  useEffect(() => {
    fetchInteractions();
  }, [statusFilter, subStatusFilter, franchiseStatusFilter, fromDateFilter, toDateFilter, startupFilter, isSubmittedFilter]);

  // Handle action
  const handleAction = async (interaction, type) => {
    setSelectedLead(interaction);
    setModalType(type);
    setIsFormOpen(true);
    setEditingInteractionId(null);

    if (type === 'add') {
      setInteractionData({
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
    }

    if (type === 'view') {
      await fetchLeadInteractions(interaction.client_id);
    }
  };

  // Save interaction
  const handleSaveInteraction = async () => {
    if (!interactionData.date || !interactionData.contact_person || !interactionData.contact_no || 
        !interactionData.status || !interactionData.sub_status || !interactionData.franchise_status || 
        !interactionData.remarks || !interactionData.next_follow_up) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const method = editingInteractionId ? 'PUT' : 'POST';
      const bodyData = editingInteractionId
        ? { interaction_id: editingInteractionId, client_id: selectedLead.client_id, ...interactionData }
        : { client_id: selectedLead.client_id, ...interactionData };
      
      const response = await fetch('/api/corporate/leadgen/interaction', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bodyData)
      });
      const data = await response.json();
      if (data.success) {
        setIsFormOpen(false);
        setInteractionData({
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
        setEditingInteractionId(null);
        fetchInteractions();
        if (selectedLead?.client_id) {
          fetchLeadInteractions(selectedLead.client_id);
        }
      } else {
        alert('Failed to save interaction');
      }
    } catch (error) {
      console.error('Failed to save interaction:', error);
    }
  };

  // Send to manager
  const handleSendToManager = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/leadgen/send-to-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ client_id: selectedLead.client_id })
      });
      const data = await response.json();
      if (data.success) {
        const updatedInteractions = interactions.map(i =>
          i.client_id === selectedLead.client_id ? { ...i, isSubmitted: true } : i
        );
        setInteractions(updatedInteractions);
        setIsFormOpen(false);
      } else {
        alert('Failed to send to manager');
      }
    } catch (error) {
      console.error('Failed to send to manager:', error);
    }
  };

  return (
    <div className="p-2 h-screen flex flex-col font-['Calibri'] bg-gray-50">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex justify-between items-center mb-2 px-2 mt-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Lead Details</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              {getFilterTitle()}
              {fromDateFilter && toDateFilter ? (
                <span className="ml-2">({fromDateFilter} - {toDateFilter})</span>
              ) : (
                <span className="ml-2 text-green-600">All Time</span>
              )}
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                {interactions.length} rows
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE FILTERS DISPLAY */}
      {(statusFilter !== 'All' || subStatusFilter !== 'All' || franchiseStatusFilter !== 'All' || (fromDateFilter && toDateFilter) || isSubmittedFilter === 'true') && (
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Filters:</span>
          {isSubmittedFilter === 'true' && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-200">
              Sent to Manager
            </span>
          )}
          {statusFilter !== 'All' && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">
              Status: {statusFilter}
            </span>
          )}
          {subStatusFilter !== 'All' && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-200">
              Sub-Status: {subStatusFilter}
            </span>
          )}
          {franchiseStatusFilter !== 'All' && (
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-200">
              Franchise: {franchiseStatusFilter}
            </span>
          )}
          {fromDateFilter && toDateFilter && (
            <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded border border-orange-200">
              Date: {fromDateFilter} to {toDateFilter}
            </span>
          )}
        </div>
      )}

      {/* 3. THE TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full table-auto border-collapse text-center">
          
          {/* --- HEADER --- */}
          <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20">
            <tr>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sourcing Date</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Company Name</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Category</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">City/State</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Contact Person</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Contact Info</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Latest Interaction</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Next Followup</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Status</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sub-Status</th>
              <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Franchise Status</th>
              <th className="px-2 py-2 text-center bg-[#0d316a] sticky right-0 z-30">Action</th>
            </tr>
          </thead>

          {/* --- BODY --- */}
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
            {loading ? (
              <tr key="loading">
                <td colSpan="12" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                  Loading leads...
                </td>
              </tr>
            ) : interactions.length > 0 ? (
              interactions.map((interaction, index) => {
                const isLocked = interaction.isSubmitted;
                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 transition group hover:bg-blue-50/40"
                  >
                    <td className="px-2 py-2 border-r border-gray-100">{interaction.date}</td>
                    <td className="px-2 py-2 border-r border-gray-100 font-bold text-[#103c7f] text-left min-w-[200px] max-w-[280px]">
                      <div className="flex items-center justify-start gap-2 pl-2">
                        {(
                          interaction?.startup === true ||
                          String(interaction?.startup).toLowerCase() === 'yes' ||
                          String(interaction?.startup) === '1' ||
                          String(interaction?.startup).toLowerCase() === 'true'
                        ) && (
                          <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0" title="Startup">
                            S
                          </span>
                        )}
                        {String(interaction?.startup).toLowerCase() === 'master union' && (
                          <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-purple-200 shrink-0" title="Master Union">
                            M
                          </span>
                        )}
                        <span className="truncate">{interaction.company}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100">{interaction.category}</td>
                    <td className="px-2 py-2 border-r border-gray-100">{interaction.district_city ? `${interaction.district_city}, ` : ''}{interaction.state}</td>
                    <td className="px-2 py-2 border-r border-gray-100 font-bold text-gray-600">{interaction.contact_person || '-'}</td>
                    <td className="px-2 py-2 border-r border-gray-100 text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-gray-700 text-[10px] flex items-center gap-1">
                          {(interaction.contact_no || interaction.phone) ? (
                            <a href={`tel:${interaction.contact_no || interaction.phone}`} className="no-underline">📞 {interaction.contact_no || interaction.phone}</a>
                          ) : '-'}
                        </span>
                        <span className="text-[9px] text-blue-500 lowercase truncate max-w-[140px]" title={interaction.email}>
                          {interaction.email ? (<a href={`mailto:${interaction.email}`} className="underline">{interaction.email}</a>) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[#103c7f] text-[10px] bg-blue-50 px-1.5 rounded w-fit">
                          {formatDateForDisplay(interaction.date)}
                        </span>
                        <span className="text-gray-600 italic truncate max-w-[200px]" title={interaction.remarks}>
                          "{interaction.remarks}"
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100 font-bold text-orange-600">{formatDateForDisplay(interaction.next_follow_up)}</td>
                    <td className="px-2 py-2 border-r border-gray-100 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border inline-block ${
                        isLocked ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        interaction.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
                        interaction.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {interaction.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100">{interaction.sub_status}</td>
                    <td className="px-2 py-2 border-r border-gray-100">{interaction.franchise_status}</td>
                    <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-blue-50/30 border-l border-gray-200 z-10 whitespace-nowrap">
                      {isLocked ? (
                        <div className="flex items-center justify-center gap-1 text-gray-400 font-bold text-[10px] bg-gray-50 py-1 px-2 rounded border border-gray-100">
                          <Lock size={12} /> Sent
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleAction(interaction, 'view')} className="p-1 text-gray-500 hover:text-[#103c7f] hover:bg-blue-100 rounded">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleAction(interaction, 'add')} className="p-1 bg-[#a1db40] text-[#103c7f] rounded hover:bg-[#8cc430] font-bold shadow-sm">
                            <Phone size={16} />
                          </button>
                          <button onClick={() => handleAction(interaction, 'send_to_manager')} className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-bold shadow-sm">
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr key="no-data">
                <td colSpan="12" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                  No interactions match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL SYSTEM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white ${
            modalType === 'view' ? 'max-w-5xl' : 
            modalType === 'send_to_manager' ? 'max-w-sm' : 
            'max-w-lg'
          }`}>
            {/* Modal Header */}
            <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wide">
                  {modalType === 'add' ? (editingInteractionId ? 'Edit Interaction' : 'Add Interaction') : 
                   modalType === 'send_to_manager' ? 'Send to Manager' : 'Lead Details'}
                </h3>
                {selectedLead && (
                  <p className="text-xs opacity-70 font-mono mt-1">{selectedLead.company}</p>
                )}
              </div>
              <button onClick={() => setIsFormOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* View Mode */}
              {modalType === 'view' && selectedLead && (
                <div className="flex flex-col h-full max-h-[80vh] font-['Calibri']">
                  <div className="bg-gray-50 border-b border-gray-200 p-5">
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 min-w-[200px]">
                        <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none truncate max-w-[250px]" title={selectedLead.company}>
                          {selectedLead.company}
                        </h2>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Company Profile
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            (selectedLead?.startup === true || String(selectedLead?.startup).toLowerCase() === 'yes' || String(selectedLead?.startup) === '1' || String(selectedLead?.startup).toLowerCase() === 'true')
                            ? 'bg-orange-50 text-orange-700 border-orange-100' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            Startup: {selectedLead?.startup || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="h-10 w-px bg-gray-300 shrink-0"></div>
                      <div className="flex items-center gap-8 flex-1 overflow-x-auto custom-scrollbar pb-1">
                        <div className="flex flex-col min-w-fit">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced Date</label>
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                            <Calendar size={13} className="text-gray-500 shrink-0"/>
                            <span className="font-mono">{selectedLead?.date || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col min-w-fit">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                          <span className="bg-blue-100 text-[#103c7f] text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide w-fit">
                            {selectedLead.category || 'General'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-fit">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / State</label>
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                            <MapPin size={13} className="text-blue-500 shrink-0"/>
                            <span className="truncate">
                              {selectedLead.city ? `${selectedLead.city}, ` : ''}{selectedLead.state}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col min-w-fit">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</label>
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                            <Users size={13} className="text-green-600 shrink-0"/>
                            <span>{selectedLead.empCount || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Interaction History
                      </h4>
                    </div>
                    <div className="overflow-y-auto h-[350px] border-t border-gray-100 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="p-4 border-b border-gray-100">Follow-up Date</th>
                            <th className="p-4 border-b border-gray-100">Contact Person</th>
                            <th className="p-4 border-b border-gray-100">Contact Info</th>
                            <th className="p-4 border-b border-gray-100 w-1/3">Remarks</th>
                            <th className="p-4 border-b border-gray-100">Status</th>
                            <th className="p-4 border-b border-gray-100">Franchise Status</th>
                            <th className="p-4 border-b border-gray-100">Next Follow-up Date</th>
                            <th className="p-4 border-b border-gray-100 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-gray-50">
                          {interactions.length > 0 ? interactions.map((interaction, index) => (
                            <tr key={index} className={`hover:bg-blue-50/30 transition duration-150 group ${index > 0 ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}>
                              <td className="p-4">
                                {interaction.date ? (
                                  <>
                                    <div className="font-bold text-[#103c7f] text-sm">{new Date(interaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">{new Date(interaction.date).getFullYear()}</div>
                                  </>
                                ) : (
                                  <div className="text-gray-400 text-sm">N/A</div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                                    {interaction.contact_person ? interaction.contact_person.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-800">{interaction.contact_person || 'N/A'}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Contact</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  {interaction.contact_no && <span className="font-mono text-gray-600 bg-gray-50 px-1.5 rounded w-fit">{interaction.contact_no}</span>}
                                  {interaction.email && <span className="text-[10px] text-blue-500 font-medium lowercase">{interaction.email}</span>}
                                  {!interaction.contact_no && !interaction.email && <span className="text-gray-400">No contact info</span>}
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition">
                                  "{interaction.remarks || 'No remarks'}"
                                </p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-bold w-20 text-center ${interaction.status === 'Interested' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                                  {interaction.status}
                                  <span className="text-[8px] opacity-70 font-normal mt-0.5">{interaction.sub_status}</span>
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-center bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                                  {interaction.franchise_status || 'N/A'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100 text-center w-fit">
                                  {interaction.next_follow_up ? new Date(interaction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {index === 0 && (
                                  <button 
                                    onClick={() => {
                                      setInteractionData({
                                        date: interaction.date || '',
                                        status: interaction.status || '',
                                        sub_status: interaction.sub_status || '',
                                        remarks: interaction.remarks || '',
                                        next_follow_up: interaction.next_follow_up || '',
                                        contact_person: interaction.contact_person || '',
                                        contact_no: interaction.contact_no || '',
                                        email: interaction.email || '',
                                        franchise_status: interaction.franchise_status || ''
                                      });
                                      setEditingInteractionId(interaction.id);
                                      setModalType('add');
                                    }} 
                                    className="p-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-bold shadow-sm"
                                    title="Edit Interaction"
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                                No interactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Interaction Mode */}
              {modalType === 'add' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 font-['Calibri']">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-start">
                    <div className="w-3/4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Last Interaction ({selectedLead?.date})
                      </p>
                      <p className="text-xs text-gray-700 italic border-l-2 border-blue-200 pl-2">
                        "{selectedLead?.remarks || "No previous remarks"}"
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedLead?.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {selectedLead?.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={interactionData.date}
                        onChange={(e) => setInteractionData({...interactionData, date: e.target.value})}
                        className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none font-medium border-gray-300"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Person <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter name"
                          value={interactionData.contact_person}
                          onChange={(e) => setInteractionData({...interactionData, contact_person: e.target.value})}
                          className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none border-gray-300"
                          list="persons"
                        />
                        <datalist id="persons">
                          {suggestions.persons.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={interactionData.contact_no}
                          onChange={(e) => setInteractionData({...interactionData, contact_no: e.target.value})}
                          className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none border-gray-300"
                          list="nos"
                        />
                        <datalist id="nos">
                          {suggestions.nos.map(n => <option key={n} value={n} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                        <input
                          type="email"
                          placeholder="Enter email"
                          value={interactionData.email}
                          onChange={(e) => setInteractionData({...interactionData, email: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                          list="emails"
                        />
                        <datalist id="emails">
                          {suggestions.emails.map(e => <option key={e} value={e} />)}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">New Status <span className="text-red-500">*</span></label>
                        <select value={interactionData.status} onChange={(e) => setInteractionData({...interactionData, status: e.target.value})} className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none border-gray-300">
                          <option value="">Select Status</option>
                          <option>Interested</option>
                          <option>Not Interested</option>
                          <option>Not Picked</option>
                          <option>Onboard</option>
                          <option>Call Later</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Sub-Status <span className="text-red-500">*</span></label>
                        <select value={interactionData.sub_status} onChange={(e) => setInteractionData({...interactionData, sub_status: e.target.value})} className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none border-gray-300">
                          <option value="">Select Sub-Status</option>
                          <option>2nd time not picked</option>
                          <option>Contract Share</option>
                          <option>Enough Vendor Empanelment</option>
                          <option>Hiring Sealed</option>
                          <option>Manager Ask</option>
                          <option>Meeting Align</option>
                          <option>Misaligned T&C</option>
                          <option>Not Right Person</option>
                          <option>Official Mail Ask</option>
                          <option>Reference Ask</option>
                          <option>Self Hiring</option>
                          <option>Ready To Visit</option>
                          <option>Callback</option>
                          <option>NA</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Franchise Status <span className="text-red-500">*</span></label>
                        <select value={interactionData.franchise_status} onChange={(e) => setInteractionData({...interactionData, franchise_status: e.target.value})} className="w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none border-gray-300">
                          <option value="">Select Franchise Status</option>
                          <option>Application Form Share</option>
                          <option>No Franchise Discuss</option>
                          <option>Not Interested</option>
                          <option>Will Think About It</option>
                          <option>Form Filled</option>
                          <option>Form Not Filled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Remarks <span className="text-red-500">*</span></label>
                        <textarea
                          value={interactionData.remarks}
                          onChange={(e) => setInteractionData({...interactionData, remarks: e.target.value})}
                          className="w-full border rounded p-2 text-sm mt-1 h-14 focus:border-[#103c7f] outline-none resize-none placeholder:text-gray-300 border-gray-300"
                          placeholder="Client kya bola?..."
                        ></textarea>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase text-orange-600">Next Follow-up Date <span className="text-red-500">*</span></label>
                      <input type="date" value={interactionData.next_follow_up} onChange={(e) => setInteractionData({...interactionData, next_follow_up: e.target.value})} className="w-full border rounded p-2 text-sm mt-1 focus:border-orange-500 outline-none font-bold text-gray-700 border-orange-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Send to Manager Mode */}
              {modalType === 'send_to_manager' && (
                <div className="flex flex-col items-center justify-center py-2 px-2 text-center">
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[80%] mx-auto">
                    Are you sure you want to send 
                    <span className="font-bold text-[#103c7f] block my-1 text-base">
                      {selectedLead?.company}
                    </span>
                    to Manager <span className="font-bold text-purple-600">({managerName})</span>? 
                    This will lock the lead.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 bg-gray-50 border-t flex gap-3 ${modalType === 'send_to_manager' ? 'justify-center' : 'justify-end'}`}>
              {modalType !== 'send_to_manager' && (
                <button onClick={() => { setIsFormOpen(false); setEditingInteractionId(null); setInteractionData({ date: new Date().toISOString().split('T')[0], status: '', sub_status: '', remarks: '', next_follow_up: '', contact_person: '', contact_no: '', email: '', franchise_status: '' }); }} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 text-sm">
                  Cancel
                </button>
              )}

              {modalType === 'add' && (
                <button onClick={handleSaveInteraction} className="bg-[#103c7f] hover:bg-blue-900 text-white px-2 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
                  <Save size={16} /> {editingInteractionId ? 'Update Record' : 'Save Record'}
                </button>
              )}

              {modalType === 'send_to_manager' && (
                <button onClick={handleSendToManager} className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 flex items-center gap-2 transition transform active:scale-95">
                  <Send size={16} /> Yes, Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper with Suspense
export default function DetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103c7f] mx-auto"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading...</p>
        </div>
      </div>
    }>
      <DetailsContent />
    </Suspense>
  );
}

// Add Save icon
function Save({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}


