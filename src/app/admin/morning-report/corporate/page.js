    "use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { 
    ArrowLeft, Search, Filter, Download, FileText, 
    Eye, Calendar, MapPin, Users, Briefcase, Edit, X , User, ChevronDown, Loader2
} from "lucide-react";

function CorporateDetailsContent() {
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');
    
    // --- STATE FOR MODAL ---
    const [modalType, setModalType] = useState(null); // null | 'view'
    const [selectedLead, setSelectedLead] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTitle, setFilterTitle] = useState('All Records');
    const [searchQuery, setSearchQuery] = useState('');
    const [leadgenUsers, setLeadgenUsers] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState('all');

    // --- FETCH DATA BASED ON FILTER ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                
                // Determine which filter to use
                let filterParam = 'all';
                
                switch(filter) {
                    case 'client-search-yesterday':
                        filterParam = 'client-search-yesterday';
                        setFilterTitle('Client Search (Yesterday)');
                        break;
                    case 'client-calling-yesterday':
                        filterParam = 'client-calling-yesterday';
                        setFilterTitle('Client Calling (Yesterday)');
                        break;
                    case 'contract-share-yesterday':
                        filterParam = 'contract-share-yesterday';
                        setFilterTitle('Contract Share (Yesterday)');
                        break;
                    case 'startup-search-yesterday':
                        filterParam = 'startup-search-yesterday';
                        setFilterTitle('Startup Search (Yesterday)');
                        break;
                    case 'startup-calling-yesterday':
                        filterParam = 'startup-calling-yesterday';
                        setFilterTitle('Startup Calling (Yesterday)');
                        break;
                    case 'franchise-discussed-yesterday':
                        filterParam = 'franchise-discussed-yesterday';
                        setFilterTitle('Franchise Discussed (Yesterday)');
                        break;
                    case 'form-ask-yesterday':
                        filterParam = 'form-ask-yesterday';
                        setFilterTitle('Form Ask (Yesterday)');
                        break;
                    case 'form-shared-yesterday':
                        filterParam = 'form-shared-yesterday';
                        setFilterTitle('Form Shared (Yesterday)');
                        break;
                    case 'master-union-clients':
                        filterParam = 'master-union-clients';
                        setFilterTitle('Master Union Clients');
                        break;
                    case 'master-union-calling':
                        filterParam = 'master-union-calling';
                        setFilterTitle('Master Union Calling');
                        break;
                    default:
                        filterParam = 'all';
                        setFilterTitle('All Records');
                }
                
                const response = await fetch(`/api/admin/morning-report/corporate?filter=${filterParam}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await response.json();
                
                if (data.success && data.data.details) {
                    setTableData(data.data.details);
                    setFilteredData(data.data.details);
                } else {
                    setTableData([]);
                    setFilteredData([]);
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

    // --- FETCH LEADGEN USERS FOR DROPDOWN ---
    useEffect(() => {
        const fetchLeadgenUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/admin/morning-report/corporate/leadgen-users', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await response.json();
                
                if (data.success && data.data) {
                    setLeadgenUsers(data.data);
                }
            } catch (error) {
                console.error('Error fetching Leadgen users:', error);
            }
        };
        
        fetchLeadgenUsers();
    }, []);

    // --- FILTER DATA WHEN SEARCH QUERY CHANGES ---
    useEffect(() => {
        let result = [...tableData];
        
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row => {
                const companyName = (row.companyName || '').toLowerCase();
                const contactName = (row.contactName || '').toLowerCase();
                return companyName.includes(query) || contactName.includes(query);
            });
        }
        
        setFilteredData(result);
    }, [searchQuery, tableData]);

    // --- HANDLER TO OPEN MODAL ---
    const handleViewClick = (lead) => {
        // Get the client_id - try multiple field names
        const leadClientId = lead.client_id || lead.clientId || lead.id;
        
        setSelectedLead({
            ...lead,
            latestFollowup: lead.lastInteractionDate
        });
        setModalType('view');
        // Fetch interactions for this lead
        fetchInteractions(leadClientId);
    };

    // --- FETCH INTERACTIONS FOR MODAL ---
    const fetchInteractions = async (clientId) => {
        if (!clientId) return;
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const response = await fetch(`/api/admin/morning-report/corporate/client?client_id=${clientId}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();
            if (data.success && data.data) {
                // Map API response fields to frontend expected fields
                const client = data.data.client;
                if (client) {
                    setSelectedLead({
                        ...client,
                        companyName: client.company,
                        latestFollowup: client.sourcing_date,
                        empCount: client.emp_count,
                        city: client.district_city,
                        state: client.state,
                        location: client.location,
                        category: client.category,
                        reference: client.reference,
                        startup: client.startup
                    });
                }
                setInteractions(data.data.interactions || []);
            } else {
                setInteractions([]);
            }
        } catch (error) {
            console.error('Error fetching interactions:', error);
            setInteractions([]);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600"/> Corporate Sales Details
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
               {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4">
                    
                    {/* Left Side: Search & Leadgen Filter */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                        
                        {/* 1. Search Bar */}
                        <div className="relative w-full sm:w-80">
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search company or contact..." 
                                className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* 2. Leadgen (Owner) Filter */}
                        <div className="relative w-full sm:w-48">
                            <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <select 
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-indigo-500 appearance-none bg-white cursor-pointer text-slate-600"
                                value={selectedOwner}
                                onChange={(e) => setSelectedOwner(e.target.value)}
                            >
                                <option value="all">All Leadgens</option>
                                {leadgenUsers.map(user => (
                                    <option key={user.user_id} value={user.name}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {/* Custom drop-down arrow */}
                            <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                        </div>

                    </div>

                    {/* Right Side: Advanced Filters */}
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shrink-0">
                        <Filter size={14} /> Filter Data
                    </button>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-indigo-50/50 border-b border-indigo-100">
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Company Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Contact Info</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Latest Interaction & Date</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Next Follow-Up</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Status & Sub-Status</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">Franchise Status</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest">User (Owner)</th>
                                <th className="py-3 px-4 text-[10px] font-black text-indigo-800 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center">
                                        <Loader2 className="animate-spin mx-auto text-indigo-600" size={24}/>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center text-gray-400 font-bold">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                <tr key={row.client_id || row.id} className="hover:bg-slate-50/80 transition-colors group">
                                    {/* Company Name */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-black text-slate-800">{row.companyName}</p>
                                    </td>
                                    
                                    {/* Contact Info (Name & Number) */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-bold text-slate-800">{row.contactName}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">{row.contactNumber}</p>
                                    </td>

                                    {/* Latest Interaction & Date */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={row.lastInteraction}>
                                            {row.lastInteraction}
                                        </p>
                                        <p className="text-[10px] font-black text-indigo-500 mt-0.5">{row.lastInteractionDate}</p>
                                    </td>

                                    {/* Next Followup Date */}
                                    <td className="py-3 px-4">
                                        <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">
                                            {row.nextFollowup}
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
                                            └ {row.substatus}
                                        </p>
                                    </td>

                                    {/* Franchise Status */}
                                    <td className="py-3 px-4">
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                                            row.franchiseStatus === 'Not Applicable' ? 'bg-slate-100 text-slate-500' : 
                                            row.franchiseStatus === 'Form Shared' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {row.franchiseStatus}
                                        </span>
                                    </td>

                                    {/* New Column: User (Owner) */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-black">
                                                {row.owner.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700">{row.owner}</p>
                                        </div>
                                    </td>

                                    {/* New Column: Action */}
                                    <td className="py-3 px-4 text-center">
                                        <button 
                                            onClick={() => handleViewClick(row)}
                                            className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors mx-auto"
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-xs font-bold text-slate-500">
                    <p>Showing 1 to {filteredData.length} of {filteredData.length} entries</p>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Prev</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
                    </div>
                </div>

            </div>

            {/* ============================================================== */}
            {/* --- MODAL FOR DETAILED VIEW --- */}
            {/* ============================================================== */}
            {modalType === 'view' && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Top Bar */}
                        <div className="flex justify-between items-center bg-[#103c7f] text-white px-5 py-3">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Eye size={16}/> Lead Information
                            </h3>
                            <button onClick={() => setModalType(null)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X size={16}/>
                            </button>
                        </div>

                        {/* Modal Body from your code */}
                        <div className="flex flex-col h-full overflow-hidden font-['Calibri']">
                            
                            {/* 1. HEADER: DETAILED COMPANY PROFILE */}
                            <div className="bg-gray-50 border-b border-gray-200 p-5 shrink-0">
                                <div className="flex items-center gap-6">
                                    {/* A. Company Name & Startup Badge */}
                                    <div className="shrink-0 min-w-[200px]">
                                        <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none truncate max-w-[250px]" title={selectedLead.companyName}>
                                            {selectedLead.companyName}
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

                                    {/* Vertical Separator */}
                                    <div className="h-10 w-px bg-gray-300 shrink-0"></div>

                                    {/* B. Details Strip (Horizontal Scrollable) */}
                                    <div className="flex items-center gap-8 flex-1 overflow-x-auto custom-scrollbar pb-1">
                                        
                                        {/* 1. Sourcing Date */}
                                        <div className="flex flex-col min-w-fit">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced Date</label>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                                                <Calendar size={13} className="text-gray-500 shrink-0"/>
                                                <span className="font-mono">{selectedLead?.latestFollowup || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* 2. Category */}
                                        <div className="flex flex-col min-w-fit">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                                            <span className="bg-blue-100 text-[#103c7f] text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide w-fit">
                                                {selectedLead.category || 'General'}
                                            </span>
                                        </div>

                                        {/* 3. City / State */}
                                        <div className="flex flex-col min-w-fit">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / State</label>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                                                <MapPin size={13} className="text-blue-500 shrink-0"/>
                                                <span className="truncate">
                                                    {selectedLead.city ? `${selectedLead.city}, ` : ''}{selectedLead.state}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 4. Location */}
                                        <div className="flex flex-col min-w-fit max-w-[150px]">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</label>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                                                <MapPin size={13} className="text-orange-500 shrink-0"/>
                                                <span className="truncate" title={selectedLead.location}>
                                                    {selectedLead.location || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 5. Emp Count */}
                                        <div className="flex flex-col min-w-fit">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</label>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                                                <Users size={13} className="text-green-600 shrink-0"/>
                                                <span>{selectedLead.empCount || '-'}</span>
                                            </div>
                                        </div>

                                        {/* 6. Reference */}
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

                            {/* 2. INTERACTION HISTORY (Modern Table) */}
                            <div className="flex-1 overflow-hidden flex flex-col bg-white">
                                
                                {/* Table Title */}
                                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center shrink-0">
                                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Interaction History
                                    </h4>
                                </div>
                                
                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-4 border-b border-gray-100 bg-white">Follow-up Date</th>
                                                <th className="p-4 border-b border-gray-100 bg-white">Contact Person</th>
                                                <th className="p-4 border-b border-gray-100 bg-white">Contact Info</th>
                                                <th className="p-4 border-b border-gray-100 bg-white w-1/3">Remarks</th>
                                                <th className="p-4 border-b border-gray-100 bg-white">Status</th>
                                                <th className="p-4 border-b border-gray-100 bg-white">Franchise Status</th>
                                                <th className="p-4 border-b border-gray-100 bg-white">Next Follow-up Date</th>
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
                    </div>
                </div>
            )}

        </div>
    );
}

// ============================================================================
// --- WRAPPER COMPONENT WITH SUSPENSE ---
// ============================================================================
export default function CorporateDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>}>
            <CorporateDetailsContent />
        </Suspense>
    );
}