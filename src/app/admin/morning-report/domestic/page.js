"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { 
    ArrowLeft, Search, Filter, Download, FileText, 
    Eye, Calendar, MapPin, Users, Briefcase, Edit, X, 
    Home, Star, Zap, Phone, CheckCircle, MessageSquarePlus, HistoryIcon, Loader2, Pencil, Mail, User , ChevronDown
} from "lucide-react";

// ============================================================================
// --- COMPONENT: CLIENT FULL VIEW MODAL (DOMESTIC) ---
// ============================================================================
function ClientFullViewModal({ lead, onClose, onEditInteraction }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fullLeadData, setFullLeadData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!lead?.client_id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                
                // Fetch full client details and interactions from new API
                const response = await fetch(`/api/admin/morning-report/domestic/client?client_id=${lead.client_id}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await response.json();
                if (data.success) {
                    // Merge client data with current status from most recent interaction
                    const clientWithStatus = {
                        ...data.data.client,
                        status: data.data.current_status || data.data.client.status,
                        sub_status: data.data.current_sub_status || data.data.client.sub_status
                    };
                    setFullLeadData(clientWithStatus);
                    setHistory(data.data.interactions || []);
                } else {
                    setFullLeadData(null);
                    setHistory([]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lead]);

    // Merge lead data with fullLeadData (fullLeadData takes precedence)
    const mergedLead = { ...lead, ...fullLeadData };

    // Helper for Compact Basic Info
    const StatCard = ({ icon: Icon, label, value, colorClass = "bg-orange-50 text-orange-700" }) => (
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm min-w-[120px] max-w-[150px] flex-1">
            <div className={`p-2 rounded-lg ${colorClass}`}>
                {Icon && <Icon size={16} strokeWidth={2.5} />}
            </div>
            <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-black text-gray-800 truncate max-w-[120px]" title={value}>{value || '--'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-orange-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-6 font-['Calibri'] animate-in fade-in duration-200">
            <div className="bg-[#f8fafc] rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95dvh] overflow-hidden flex flex-col border border-white/50 animate-in zoom-in-95 duration-200">
                
                {/* 1. HEADER */}
                <div className="px-8 py-6 bg-white border-b border-gray-100 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Home size={24} className="text-orange-700" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-orange-900 uppercase italic tracking-tight leading-none">
                                    {mergedLead?.companyName || mergedLead?.company_name}
                                </h2>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <MapPin size={10} /> {mergedLead?.location}, {mergedLead?.state}
                                    </span>
                                    {mergedLead?.client_type === 'Premium' && (
                                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border border-yellow-200">
                                            <Star size={9} fill="currentColor" /> Premium Client
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-full text-gray-400 transition hover:text-red-500">
                        <X size={26}/>
                    </button>
                </div>

                {/* SCROLLABLE CONTENT (Main Modal Body) */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8 space-y-6">
                    
                    {/* 2. BASIC INFO STRIP */}
                    <div className="flex flex-wrap gap-2">
                        <StatCard label="Sourcing Date" value={mergedLead?.sourcing_date || mergedLead?.lastInteractionDate} icon={Calendar} />
                        <StatCard label="Category" value={mergedLead?.category} icon={Zap} />
                        <StatCard label="Sourcing Mode" value={mergedLead?.sourcing_mode || mergedLead?.contact_mode || "Direct Calling"} icon={Phone} />
                        <StatCard label="Emp Count" value={mergedLead?.empCount || mergedLead?.employee_count} icon={User} />
                        <StatCard label="Reference" value={mergedLead?.reference} icon={MessageSquarePlus} />
                        <StatCard label="Current Status" value={mergedLead?.status} icon={CheckCircle} colorClass="bg-blue-50 text-blue-600"/>
                        <StatCard label="Projection" value={mergedLead?.projection} icon={Briefcase} colorClass="bg-emerald-50 text-emerald-600 "/>
                    </div>

                    {/* 3. INTERACTION HISTORY TABLE */}
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                        
                        {/* Table Header Strip */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                            <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest flex items-center gap-2">
                                <HistoryIcon size={18}/> Interaction Timeline
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                Total Interactions: {history.length}
                            </span>
                        </div>
                        
                        {/* SCROLLABLE TABLE CONTAINER */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[320px] custom-scrollbar relative">
                            <table className="w-full text-left text-[12px]">
                                {/* Sticky Header */}
                                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-400 font-black uppercase tracking-wider border-b border-gray-100 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-4 w-[13%]">Date & Mode</th>
                                        <th className="px-4 py-4 w-[14%]">Contact Person</th>
                                        <th className="px-4 py-4 w-[35%]">Discussion Remarks</th>
                                        <th className="px-4 py-4 w-[13%]">Next Followup</th>
                                        <th className="px-4 py-4 w-[15%]">Status & Sub-status</th>
                                    </tr>
                                </thead>
                                
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-600" size={24}/></td></tr>
                                    ) : history.length === 0 ? (
                                        <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-bold italic">No history available</td></tr>
                                    ) : (
                                        history.map((item, index) => (
                                            <tr key={item.interaction_id} className="hover:bg-orange-50/30 transition group relative">
                                                
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-orange-800 text-sm">{item.contact_date}</span>
                                                        <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${item.contact_mode === 'Visit' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            {item.contact_mode}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700 text-sm">{item.contact_person}</span>
                                                        <div className="flex flex-col mt-1 text-gray-400 text-[10px] font-medium space-y-0.5">
                                                            {item.contact_no !== 'N/A' && <span className="flex items-center gap-1"><Phone size={10}/> {item.contact_no}</span>}
                                                            {item.email !== 'N/A' && <span className="flex items-center gap-1"><Mail size={10}/> {item.email}</span>}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <p className="text-gray-600 font-medium leading-relaxed" title={item.remarks}>
                                                        {item.remarks}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit text-xs border border-emerald-100">
                                                            {item.next_follow_up}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-orange-700 text-[11px] uppercase">
                                                            {item.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                                                            {item.sub_status || '--'}
                                                        </span>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// --- MAIN PAGE: DOMESTIC DETAILS LIST ---
// ============================================================================
function DomesticDetailsContent() {
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');
    
    // --- STATE FOR MODAL ---
    const [modalType, setModalType] = useState(null); // null | 'view'
    const [selectedLead, setSelectedLead] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTitle, setFilterTitle] = useState('All Records');

    // --- FETCH DATA BASED ON FILTER ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                
                // Determine which API to call based on filter
                let filterParam = '';
                
                switch(filter) {
                    case 'yesterday-visits':
                        filterParam = 'yesterday-visits';
                        setFilterTitle('Yesterday Visits');
                        break;
                    case 'individual-repeat':
                        filterParam = 'individual-repeat';
                        setFilterTitle('Individual / Repeat Visits');
                        break;
                    case 'reached-out':
                        filterParam = 'reached-out';
                        setFilterTitle('Reached Out (Yesterday)');
                        break;
                    case 'interested':
                        filterParam = 'interested';
                        setFilterTitle('Interested (Yesterday)');
                        break;
                    case 'total-onboard':
                        filterParam = 'total-onboard';
                        setFilterTitle('Total Onboard (Current Month)');
                        break;
                    case 'onboarded-yesterday':
                        filterParam = 'onboarded-yesterday';
                        setFilterTitle('Onboarded (Yesterday)');
                        break;
                    default:
                        filterParam = 'all';
                        setFilterTitle('All Records');
                }
                
                const response = await fetch(`/api/admin/morning-report/domestic?filter=${filterParam}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await response.json();
                
                if (data.success && data.data.details) {
                    setTableData(data.data.details);
                } else {
                    setTableData([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setTableData([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [filter]);

    // --- HANDLER TO OPEN MODAL ---
    const handleViewClick = (lead) => {
        setSelectedLead(lead);
        setModalType('view');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                            <Home size={20} className="text-orange-600"/> Domestic Sales Details
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            {filterTitle}
                        </p>
                    </div>
                </div>
                
            </div>

            {/* --- TABLE CONTAINER --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                 {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4">
                    
                    {/* Left Side: Search & User Filter */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                        
                        {/* 1. Search Bar */}
                        <div className="relative w-full sm:w-80">
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search company or contact..." 
                                className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-orange-500 bg-white"
                            />
                        </div>

                        {/* 2. FSE (Owner) Filter */}
                        <div className="relative w-full sm:w-48">
                            <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <select 
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-orange-500 appearance-none bg-white cursor-pointer text-slate-600"
                                defaultValue="all"
                            >
                                <option value="all">All FSEs (Owners)</option>
                                <option value="aman_gupta">Aman Gupta</option>
                                <option value="riya_desai">Riya Desai</option>
                                <option value="khushi_chawla">Khushi Chawla</option>
                            </select>
                            {/* Custom drop-down arrow */}
                            <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                        </div>

                    </div>

                    {/* Right Side: Advanced Filters */}
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shrink-0">
                        <Filter size={14} /> Advanced Filter
                    </button>

                </div>

                {/* Data Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-orange-50/50 border-b border-orange-100">
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Company Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Contact Info</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Latest Interaction & Date</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Next Follow-Up</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Status & Sub-Status</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">Projection</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest">User (Owner)</th>
                                <th className="py-3 px-4 text-[10px] font-black text-orange-900 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center">
                                        <Loader2 className="animate-spin mx-auto text-orange-600" size={24}/>
                                    </td>
                                </tr>
                            ) : tableData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center text-gray-400 font-bold">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row) => (
                                    <tr key={row.id || row.client_id || row.company_id} className="hover:bg-orange-50/30 transition-colors group">
                                        {/* Company Name */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-slate-800">{row.companyName || row.company_name}</p>
                                                {row.status === 'Individual' && (
                                                    <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">New</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {/* Contact Info (Name & Number) */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-bold text-slate-800">{row.contactName || row.contact_person}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{row.contactNumber || row.contact_no}</p>
                                        </td>

                                        {/* Latest Interaction & Date */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={row.lastInteraction}>
                                                {row.lastInteraction || row.remarks}
                                            </p>
                                            <p className="text-[10px] font-black text-orange-600 mt-0.5">{row.lastInteractionDate || row.contact_date}</p>
                                        </td>

                                        {/* Next Followup Date */}
                                        <td className="py-3 px-4">
                                            <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">
                                                {row.nextFollowup || row.next_follow_up}
                                            </div>
                                        </td>

                                        {/* Status & Substatus */}
                                        <td className="py-3 px-4">
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${
                                                row.status === 'Onboarded' ? 'text-green-600' : 
                                                row.status === 'Interested' ? 'text-blue-600' : 'text-orange-600'
                                            }`}>
                                                {row.status}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                                                └ {row.substatus || row.sub_status}
                                            </p>
                                        </td>

                                        {/* Projection  */}
                                        <td className="py-3 px-4">
                                            <span className="text-xs font-black text-emerald-700">
                                                {row.projection}
                                            </span>
                                        </td>

                                        {/* User (Owner) */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-black">
                                                    {(row.owner || 'U').split(' ').map(n => n[0]).join('').substring(0,2)}
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">{row.owner || 'Unknown'}</p>
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="py-3 px-4 text-center">
                                            <button 
                                                onClick={() => handleViewClick(row)}
                                                className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors mx-auto"
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-xs font-bold text-slate-500">
                    <p>Showing 1 to {tableData.length} of {tableData.length} entries</p>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Prev</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
                    </div>
                </div>

            </div>

            {/* --- RENDER MODAL CONDITIIONALLY --- */}
            {modalType === 'view' && selectedLead && (
                <ClientFullViewModal 
                    lead={selectedLead} 
                    onClose={() => setModalType(null)} 
                />
            )}

        </div>
    );
}

// ============================================================================
// --- WRAPPER COMPONENT WITH SUSPENSE ---
// ============================================================================
export default function DomesticDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={32}/></div>}>
            <DomesticDetailsContent />
        </Suspense>
    );
}
