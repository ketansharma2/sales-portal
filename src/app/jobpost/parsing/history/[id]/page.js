"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, History, User, Plus, Send, Trash2, Building2,
    Calendar, Phone, Briefcase, MapPin, IndianRupee, Clock,
    FileText, CheckCircle2, MessageSquareText, AlertCircle, Bookmark,X , Edit
} from "lucide-react";

// --- MOCK DATA ---
const MOCK_TL_DETAILS = { user_id: "tl123", name: "Gurmeet Aneja", email: "gurmeet@mavenjobs.in" };

const MOCK_WORKBENCH_OPTIONS = [
    { id: "req1", date: "2026-04-10", client: "TechNova Solutions", profile: "Frontend Developer" },
    { id: "req2", date: "2026-04-10", client: "Google", profile: "Backend Engineer" },
    { id: "req3", date: "2026-04-05", client: "Global Finance", profile: "Backend Engineer" },
    { id: "req4", date: "2026-04-12", client: "Urban Builders", profile: "UI/UX Designer" }
];

const MOCK_FOLLOWUPS = [
    {
        id: 1,
        company_name: "TechNova Solutions", // company_name की जगह client_name
        profile: "Frontend Developer",
        postDate: "2026-04-08",          // slot की जगह postDate
        applyDate: "2026-04-10",
        callingDate: "2026-04-12",
        relExp: "2 Yrs",
        currCtc: "5 LPA",
        expCtc: "8 LPA",
        status: "Shortlisted",
        feedback: "Good communication, technically strong.",
        isTracker: false,
        rc_name: "Neha Gupta",
        rc_id: "user1"
    },
    {
        id: 2,
        company_name: "Global Finance",     // company_name की जगह client_name
        profile: "Backend Engineer",
        postDate: "2026-04-01",          // slot की जगह postDate
        applyDate: "2026-04-05",
        callingDate: "2026-04-06",
        relExp: "4 Yrs",
        currCtc: "8 LPA",
        expCtc: "12 LPA",
        status: "Interview",
        feedback: "Scheduled for technical round next week.",
        isTracker: true,
        rc_name: "Neha Gupta",
        rc_id: "user1" // Assume current user is "user1"
    }
];


export default function CandidateHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const candidateId = params.id;

    // --- STATE ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTLModalOpen, setIsTLModalOpen] = useState(false);
    const [selectedFollowupId, setSelectedFollowupId] = useState(null);
    const [tlDetails, setTlDetails] = useState(null);
    
    // --- EDIT STATE & HANDLERS ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const getToday = () => new Date().toISOString().split('T')[0];

    const handleEditOpen = (row) => {
        const today = getToday();
        if (row.callingDate !== today && false) { // Removed date restriction for testing
            alert("You can't edit past conversations. Only today's followups can be edited.");
            return;
        }
        
        setFormData({
            req_id: row.req_id || '',
            profile: row.profile,
            slot: row.slot || '',
            applyDate: row.applyDate,
            callingDate: row.callingDate,
            relExp: row.relExp || '',
            currCtc: row.currCtc || '',
            expCtc: row.expCtc || '',
            status: row.status,
            feedback: row.feedback
        });
        setEditId(row.id);
        setIsEditModalOpen(true);
    };

    const [isUpdatingFollowup, setIsUpdatingFollowup] = useState(false);

    const handleUpdateFollowup = () => {
        if (!formData.status || !formData.applyDate || !formData.callingDate || 
            !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
            alert("Please fill all mandatory fields marked with *");
            return;
        }

        setIsUpdatingFollowup(true);
        
        // MOCK API Call
        setTimeout(() => {
            setFollowups(followups.map(f => f.id === editId ? { ...f, ...formData } : f));
            setIsEditModalOpen(false);
            setEditId(null);
            setIsUpdatingFollowup(false);
            alert("Followup updated successfully! (Mock)");
        }, 800);
    };

    const statusOptions = [
        "Shortlisted", "Conversion", "Asset", "Not Picked", 
        "Not Interseted", "Interview", "Not In Service", "Other"
    ];

    const slotOptions = ["10:00 - 11:30", "12:00 - 01:30", "02:00 - 03:30", "Other"];

    const initialForm = {
        postDate: getToday(), // By default today's date
        req_id: "",           // We'll still keep req_id internally
        client_name: "", 
        profile: "",
        applyDate: getToday(), 
        callingDate: getToday(),
        relExp: "", currCtc: "", expCtc: "",
        status: "", feedback: ""
    };
    const [formData, setFormData] = useState(initialForm);

    const [workbenchOptions, setWorkbenchOptions] = useState([]);
    const [isLoadingWorkbench, setIsLoadingWorkbench] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("user1"); // Mock current user ID

    // Fetch workbench data on mount (MOCK)
    useEffect(() => {
        setIsLoadingWorkbench(true);
        setTimeout(() => {
            setWorkbenchOptions(MOCK_WORKBENCH_OPTIONS);
            setIsLoadingWorkbench(false);
        }, 500);
    }, []);

    // --- FOLLOWUPS STATE ---
    const [followups, setFollowups] = useState([]);
    const [isLoadingFollowups, setIsLoadingFollowups] = useState(true);

    // Fetch existing followups (MOCK)
    useEffect(() => {
        setIsLoadingFollowups(true);
        setTimeout(() => {
            setFollowups(MOCK_FOLLOWUPS);
            setIsLoadingFollowups(false);
        }, 800);
    }, [candidateId]);

    // Fetch TL details on page load (MOCK)
    useEffect(() => {
        setTlDetails(MOCK_TL_DETAILS);
    }, []);

    // --- HANDLERS ---
    const handleAddOpen = () => {
        setFormData(initialForm);
        setIsAddModalOpen(true);
    };

    const [isSavingFollowup, setIsSavingFollowup] = useState(false);

    const handleSaveFollowup = () => {
        if (!formData.profile || !formData.status || !formData.applyDate || !formData.callingDate || 
            !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
            alert("Please fill all mandatory fields marked with *");
            return;
        }

        setIsSavingFollowup(true);
        
        // MOCK API Call
        setTimeout(() => {
            const newFollowup = {
                ...formData,
                id: Date.now(), // Generate mock ID
                isTracker: false,
                rc_id: currentUserId,
                rc_name: "Neha Gupta" // Mock current user name
            };
            setFollowups([newFollowup, ...followups]);
            setIsAddModalOpen(false);
            setIsSavingFollowup(false);
            alert("Followup added successfully! (Mock)");
        }, 1000);
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this followup?")) {
            setIsDeleting(true);
            
            // MOCK API Call
            setTimeout(() => {
                setFollowups(followups.filter(f => f.id !== id));
                setIsDeleting(false);
            }, 600);
        }
    };

    const handleSendToTL = (id) => {
        if (tlDetails) {
            setSelectedFollowupId(id);
            setIsTLModalOpen(true);
        } else {
            alert("No Team Lead assigned to you. Please contact your administrator.");
        }
    };

    const [isSendingToTL, setIsSendingToTL] = useState(false);

    const confirmSendToTL = () => {
        if (!selectedFollowupId || !tlDetails) return;
        
        setIsSendingToTL(true);
        
        // MOCK API Call
        setTimeout(() => {
            setFollowups(followups.map(f => 
                f.id === selectedFollowupId 
                    ? { ...f, isTracker: true, tl_name: tlDetails.name } 
                    : f
            ));
            setIsTLModalOpen(false);
            setSelectedFollowupId(null);
            setIsSendingToTL(false);
            alert("Successfully sent to Team Lead! (Mock)");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-3">
            
            {/* Header with Back Button */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#103c7f] transition-colors mb-3 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        <ArrowLeft size={14} /> Back to Parsing Queue
                    </button>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <History size={24}/> Candidate History Log
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Candidate System ID: #{candidateId || "MOCK_ID"}
                    </p>
                </div>

                <button 
                    onClick={handleAddOpen}
                    className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16}/> Add New Followup
                </button>
            </div>

          {/* ========================================================= */}
            {/* SECTION 1: FOLLOWUP HISTORY (FULL WIDTH) */}
            {/* ========================================================= */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                    <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <MessageSquareText size={16} /> Followup History & Tracking
                    </h3>
                    <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                        Total Followups: {followups.length}
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar min-h-[300px] max-h-[70vh]">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                       <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="border-b-2 border-slate-100">
                                <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-10">#</th>
                                <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">RC Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Post Date</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Profile</th>                                
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Relevant Exp</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Curr CTC/Exp CTC</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">Feedback</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Candidate Status</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-200 w-36 sticky right-0 bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoadingFollowups ? (
                                <tr><td colSpan="9" className="text-center py-10 text-slate-400 font-bold">Loading...</td></tr>
                            ) : followups.length > 0 ? followups.map((row, idx) => (
                                <tr key={row.id} className={`transition-colors ${row.isTracker ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-blue-50/30'}`}>
                                    <td className="py-3 px-3 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                                    
                                    <td className="py-3 px-3">
                                        <span className="text-[10px] font-black text-slate-600 uppercase">{row.rc_name || '-'}</span>
                                    </td>
                                    
                                    {/* 1st Split Column: Post Date */}
                                    <td className="py-3 px-4">
                                        {row.postDate && row.postDate !== '-' ? (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">
                                                <Calendar size={10} className="text-blue-500" />
                                                <span>{row.postDate}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-medium">-</span>
                                        )}
                                    </td>

                                    {/* 2nd Split Column: Client & Profile */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                            {row.company_name && row.company_name !== '-' && (
                                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                                                    <Building2 size={8} className="inline mr-1" />
                                                    {row.company_name}
                                                </span>
                                            )}
                                            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 mt-0.5">
                                                <Briefcase size={12} className="text-slate-400" />
                                                {row.profile}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4">
                                        <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Calendar size={10}/> Apply: {row.applyDate}</p>
                                        <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mt-0.5"><Phone size={10}/> Call: {row.callingDate}</p>
                                    </td>

                                    <td className="py-3 px-4">
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-black">{row.relExp}</span>
                                    </td>

                                    <td className="py-3 px-4 text-center">
                                        <p className="text-[11px] font-bold text-slate-500">{row.currCtc || "-"} / <span className="text-emerald-600">{row.expCtc || "-"}</span></p>
                                    </td>

                                    <td className="py-3 px-4 max-w-[200px] whitespace-normal">
                                        <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">"{row.feedback}"</p>
                                    </td>

                                    <td className="py-3 px-4 text-center">
                                        {(() => {
                                            const statusColors = {
                                                'Shortlisted': 'bg-amber-100 text-amber-700 border-amber-200',
                                                'Conversion': 'bg-green-100 text-green-700 border-green-200',
                                                'Asset': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                'Not Picked': 'bg-red-100 text-red-700 border-red-200',
                                                'Not Interseted': 'bg-rose-100 text-rose-700 border-rose-200',
                                                'Interview': 'bg-blue-100 text-blue-700 border-blue-200',
                                                'Not In Service': 'bg-slate-100 text-slate-600 border-slate-200',
                                                'Other': 'bg-purple-100 text-purple-700 border-purple-200'
                                            };
                                            const badgeClass = statusColors[row.status] || 'bg-slate-100 text-slate-600 border-slate-200';
                                            return (
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${badgeClass}`}>
                                                    {row.status}
                                                </span>
                                            );
                                        })()}
                                    </td>

                                    {/* Action Buttons & Sent Status */}
                                    <td className="py-3 px-4 text-center border-l border-slate-200 sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors">
                                        {row.isTracker ? (
                                            /* Show SENT status instead of buttons */
                                            <div className="flex items-center justify-center gap-1 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Sent
                                            </div>
                                        ) : row.rc_id === currentUserId ? (
                                            /* Show Action Buttons */
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    onClick={() => handleEditOpen(row)}
                                                    className="w-7 h-7 rounded border flex items-center justify-center transition-colors bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                                    title="Edit Followup"
                                                >
                                                    <Edit size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => handleSendToTL(row.id)}
                                                    className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                                    title="Send to TL"
                                                >
                                                    <Send size={12} className="ml-0.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(row.id)}
                                                    disabled={isDeleting}
                                                    className="w-7 h-7 rounded flex items-center justify-center transition-colors bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 disabled:opacity-50"
                                                    title="Delete Followup"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-400 italic">Other's</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="9" className="py-10 text-center text-slate-400">
                                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50"/>
                                        <p className="text-xs font-bold uppercase tracking-widest">No followups available</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

           {/* ========================================================= */}
            {/* ADD FOLLOWUP MODAL */}
            {/* ========================================================= */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden border-4 border-white">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] text-white p-5 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={18}/> Add New Followup
                                </h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Form Body - Grid Layout */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 custom-scrollbar bg-slate-50/30">
                            
                             {/* --- NEW: Dependent Dropdown Logic --- */}
                             
                             {/* Step 1: Select Post Date */}
                             <div>
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                     Post Date <span className="text-red-500">*</span>
                                 </label>
                                 <div className="relative">
                                     <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                     <input 
                                         type="date" 
                                         className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                         value={formData.postDate} 
                                         onChange={(e) => {
                                             // Update postDate and reset client/profile since the date changed
                                             setFormData({
                                                 ...formData, 
                                                 postDate: e.target.value,
                                                 req_id: "",
                                                 client_name: "",
                                                 profile: ""
                                             });
                                         }}
                                     />
                                 </div>
                             </div>

                             {/* Step 2: Select Client & Profile based on Post Date */}
                             <div>
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                     Select Client & Profile <span className="text-red-500">*</span>
                                 </label>
                                  <select 
                                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:bg-slate-50"
                                      value={formData.req_id} 
                                      disabled={!formData.postDate}
                                      onChange={(e) => {
                                          const selectedJob = workbenchOptions.find(job => job.id === e.target.value);
                                          if (selectedJob) {
                                              setFormData({
                                                  ...formData,
                                                  req_id: selectedJob.id,
                                                  client_name: selectedJob.client,
                                                  profile: selectedJob.profile
                                              });
                                          } else {
                                              setFormData({
                                                  ...formData,
                                                  req_id: "",
                                                  client_name: "",
                                                  profile: ""
                                              });
                                          }
                                      }}
                                  >
                                     <option value="">-- Choose Profile --</option>
                                     {isLoadingWorkbench ? (
                                         <option value="" disabled>Loading...</option>
                                     ) : (
                                         // FILTER options based on selected postDate
                                         workbenchOptions
                                            .filter(job => job.date === formData.postDate)
                                            .map(job => (
                                                 <option key={job.id} value={job.id}>
                                                     {job.client} • {job.profile}
                                                 </option>
                                             ))
                                     )}
                                     {/* Show message if no jobs found for that date */}
                                     {!isLoadingWorkbench && formData.postDate && workbenchOptions.filter(job => job.date === formData.postDate).length === 0 && (
                                         <option value="" disabled>No postings found on this date</option>
                                     )}
                                 </select>
                             </div>
                             {/* --- END NEW LOGIC --- */}

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Apply Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        value={formData.applyDate} onChange={(e) => setFormData({...formData, applyDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Calling Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        value={formData.callingDate} onChange={(e) => setFormData({...formData, callingDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Relevant Experience <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 2 Yrs" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.relExp} onChange={(e) => setFormData({...formData, relExp: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Candidate Status <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="">-- Select Status --</option>
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Current CTC <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 6 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.currCtc} onChange={(e) => setFormData({...formData, currCtc: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Expected CTC <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 9 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.expCtc} onChange={(e) => setFormData({...formData, expCtc: e.target.value})}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Feedback / Remarks <span className="text-red-500">*</span></label>
                                <textarea 
                                    rows="3" placeholder="Enter detailed interaction notes..." 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                                    value={formData.feedback} onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsAddModalOpen(false)} className="bg-white border border-slate-300 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveFollowup} 
                                disabled={isSavingFollowup}
                                className="bg-[#103c7f] hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSavingFollowup ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={14}/> Save Followup
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {/* ========================================================= */}
           {/* ========================================================= */}
            {/* EDIT FOLLOWUP MODAL */}
            {/* ========================================================= */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden border-4 border-white">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] text-white p-5 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <Edit size={18}/> Edit Followup
                                </h2>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Form Body - Grid Layout */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 custom-scrollbar bg-slate-50/30">
                            
                            {/* Combined Profile & Slot Dropdown */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Assigned Profile & Slot</label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.req_id} 
                                    onChange={(e) => {
                                        const selectedOption = workbenchOptions.find(opt => opt.value === e.target.value);
                                        if (selectedOption) {
                                            const labelParts = selectedOption.label.split(' • ');
                                            setFormData({
                                                ...formData,
                                                req_id: e.target.value,
                                                profile: labelParts[0] || '',
                                                slot: labelParts[1] || ''
                                            });
                                        } else {
                                            setFormData({
                                                ...formData,
                                                req_id: "",
                                                profile: "",
                                                slot: ""
                                            });
                                        }
                                    }}
                                >
                                    <option value="">-- Choose Profile & Slot --</option>
                                    {isLoadingWorkbench ? (
                                        <option value="" disabled>Loading...</option>
                                    ) : (
                                        workbenchOptions.length > 0 ? (
                                            workbenchOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No profiles available</option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Apply Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        value={formData.applyDate} onChange={(e) => setFormData({...formData, applyDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Calling Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        value={formData.callingDate} onChange={(e) => setFormData({...formData, callingDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Relevant Experience <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 2 Yrs" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.relExp} onChange={(e) => setFormData({...formData, relExp: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Candidate Status <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="">-- Select Status --</option>
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Current CTC <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 6 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.currCtc} onChange={(e) => setFormData({...formData, currCtc: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Expected CTC <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" placeholder="e.g. 9 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.expCtc} onChange={(e) => setFormData({...formData, expCtc: e.target.value})}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Feedback / Remarks <span className="text-red-500">*</span></label>
                                <textarea 
                                    rows="3" placeholder="Enter detailed interaction notes..." 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                                    value={formData.feedback} onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsEditModalOpen(false)} className="bg-white border border-slate-300 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateFollowup} 
                                disabled={isUpdatingFollowup}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUpdatingFollowup ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={14}/> Update Details
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {/* ========================================================= */}
            {/* SEND TO TL MODAL */}
            {/* ========================================================= */}
            {isTLModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border-4 border-white">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] text-white p-5 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <Send size={18}/> Send to Team Lead
                                </h2>
                            </div>
                            <button onClick={() => { setIsTLModalOpen(false); setSelectedFollowupId(null); }} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 bg-slate-50/30">
                            {tlDetails ? (
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-600 mb-4">You are about to send this candidate to:</p>
                                    <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <User size={24} className="text-emerald-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-black text-slate-800">{tlDetails.name}</p>
                                                <p className="text-xs font-bold text-slate-500">{tlDetails.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">This action will move the record to Tracker History</p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No Team Lead assigned to you</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Please contact your administrator</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => { setIsTLModalOpen(false); setSelectedFollowupId(null); }} className="bg-white border border-slate-300 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                                Cancel
                            </button>
                            {tlDetails && (
                                <button 
                                    onClick={confirmSendToTL} 
                                    disabled={isSendingToTL}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSendingToTL ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14}/> Confirm Send
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}