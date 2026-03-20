"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, History, User, Plus, Send, Trash2, 
    Calendar, Phone, Briefcase, MapPin, IndianRupee, Clock,
    FileText, CheckCircle2, MessageSquareText, AlertCircle, Bookmark,X , Edit
} from "lucide-react";

export default function CandidateHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const candidateId = params.id;

    // --- STATE ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // --- EDIT STATE & HANDLERS ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const handleEditOpen = (row) => {
        setFormData({
            profile: row.profile,
            slot: row.slot || "",
            applyDate: row.applyDate,
            callingDate: row.callingDate,
            relExp: row.relExp,
            currCtc: row.currCtc,
            expCtc: row.expCtc,
            status: row.status,
            feedback: row.feedback
        });
        setEditId(row.id);
        setIsEditModalOpen(true);
    };

    const handleUpdateFollowup = () => {
        if(!formData.profile || !formData.status) {
            alert("Please fill mandatory fields (Profile & Status)");
            return;
        }

        setFollowups(followups.map(f => f.id === editId ? { ...f, ...formData } : f));
        setIsEditModalOpen(false);
        setEditId(null);
    };
    // Status Options exactly from your screenshot
    const statusOptions = [
        "Shortlisted", 
        "Conversion", 
        "Asset", 
        "Not Picked", 
        "Not Interseted", 
        "Interview", 
        "Not In Service", 
        "Other"
    ];

    // Slot Options from previous screenshot
    const slotOptions = [
        "10:00 - 11:30", 
        "12:00 - 01:30", 
        "02:00 - 03:30", 
        "Other"
    ];

    // Form State
    const getToday = () => new Date().toISOString().split('T')[0];
    const initialForm = {
        profile: "",
        slot: "",
        applyDate: getToday(),
        callingDate: getToday(),
        relExp: "",
        currCtc: "",
        expCtc: "",
        status: "",
        feedback: ""
    };
    const [formData, setFormData] = useState(initialForm);

    // --- MOCK DATA FOR FOLLOWUPS ---
    const [followups, setFollowups] = useState([
        {
            id: 1, profile: "Frontend Developer 10:00 - 11:30", slot: "10:00 - 11:30", applyDate: "2026-03-01", 
            callingDate: "2026-03-02", relExp: "2 Yrs", currCtc: "6 LPA", expCtc: "9 LPA", 
            status: "Interview", feedback: "Candidate has good React knowledge. Available immediately.", isTracker: true
        },
        {
            id: 2, profile: "Java Developer 12:00 - 01:30 ", slot: "12:00 - 01:30", applyDate: "2026-03-05", 
            callingDate: "2026-03-06", relExp: "3 Yrs", currCtc: "8 LPA", expCtc: "12 LPA", 
            status: "Asset", feedback: "Asking for too much hike. Kept in asset.", isTracker: false
        }
    ]);

    // --- HANDLERS ---
    const handleAddOpen = () => {
        setFormData(initialForm);
        setIsAddModalOpen(true);
    };

    const handleSaveFollowup = () => {
        if(!formData.profile || !formData.status) {
            alert("Please fill mandatory fields (Profile & Status)");
            return;
        }

        const newFollowup = {
            ...formData,
            id: Date.now(),
            isTracker: false
        };

        setFollowups([newFollowup, ...followups]);
        setIsAddModalOpen(false);
    };

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this followup?")) {
            setFollowups(followups.filter(f => f.id !== id));
        }
    };

    const handleSendToTL = (id) => {
        if(window.confirm("Send this candidate to Team Lead? This will move the record to Tracker History.")) {
            setFollowups(followups.map(f => f.id === id ? { ...f, isTracker: true } : f));
        }
    };

    // Separating Active Followups and Tracker History
    const activeFollowups = followups.filter(f => !f.isTracker);
    const trackerHistory = followups.filter(f => f.isTracker);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
            
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
                        Candidate System ID: #{candidateId}
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
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">#</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Profile & Slot</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Relevant Exp</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Curr CTC/Exp CTC</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">Feedback</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Candidate Status</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-200 w-36">Actions</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-200 w-32 sticky right-0 bg-slate-50">Tracker Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {followups.length > 0 ? followups.map((row, idx) => (
                                <tr key={row.id} className={`transition-colors ${row.isTracker ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-blue-50/30'}`}>
                                    <td className="py-3 px-4 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                                    
                                    {/* Display Combined Profile String */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-black text-slate-800 whitespace-normal min-w-[150px]">{row.profile}</p>
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
                                        <select 
                                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded p-1.5 outline-none cursor-pointer"
                                            value={row.status}
                                            onChange={(e) => {
                                                const updated = followups.map(f => f.id === row.id ? {...f, status: e.target.value} : f);
                                                setFollowups(updated);
                                            }}
                                        >
                                            <option value="">Select</option>
                                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </td>

                                    {/* Action Buttons (Edit, Delete, Send) */}
                                    <td className="py-3 px-4 text-center border-l border-slate-200">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button 
    onClick={() => handleEditOpen(row)}
    className="w-7 h-7 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors"
    title="Edit Followup"
>
    <Edit size={12} />
</button>
                                            <button 
                                                onClick={() => handleSendToTL(row.id)}
                                                disabled={row.isTracker}
                                                className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={row.isTracker ? "Already Sent" : "Send to TL"}
                                            >
                                                <Send size={12} className={row.isTracker ? "" : "ml-0.5"} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(row.id)}
                                                className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                                title="Delete Followup"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>

                                    {/* Tracker Status Column */}
                                    <td className="py-3 px-4 sticky right-0 bg-white border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-32 text-center">
                                        {row.isTracker ? (
                                            <div>
                                                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-max mx-auto">
                                                    <CheckCircle2 size={10}/> Sent to TL
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Gurmeet</p>
                                            </div>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                                                Not Sent
                                            </span>
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
                            
                            {/* Combined Profile & Slot Dropdown (Full Width on mobile, spans 2 cols if needed, but keeping 1 col here as per design) */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Assigned Profile & Slot</label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.profile} 
                                    onChange={(e) => {
                                        // Hum value me combined string save kar rahe hain, isko split karke table display me manage kar sakte hain if needed.
                                        setFormData({...formData, profile: e.target.value, slot: ""}) 
                                    }}
                                >
                                    <option value="">-- Choose Profile & Slot --</option>
                                    <option value="Frontend Developer (TechCorp) • 10:00 - 11:30">Frontend Developer (TechCorp) • 10:00 - 11:30</option>
                                    <option value="Frontend Developer (TechCorp) • 12:00 - 01:30">Frontend Developer (TechCorp) • 12:00 - 01:30</option>
                                    <option value="B2B Sales Exec (Global Corp) • 02:00 - 03:30">B2B Sales Exec (Global Corp) • 02:00 - 03:30</option>
                                    <option value="Java Developer (Startup Inc) • Other">Java Developer (Startup Inc) • Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Apply Date</label>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Calling Date</label>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Relevant Experience</label>
                                <input 
                                    type="text" placeholder="e.g. 2 Yrs" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.relExp} onChange={(e) => setFormData({...formData, relExp: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Candidate Status</label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="">-- Select Status --</option>
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Current CTC</label>
                                <input 
                                    type="text" placeholder="e.g. 6 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.currCtc} onChange={(e) => setFormData({...formData, currCtc: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Expected CTC</label>
                                <input 
                                    type="text" placeholder="e.g. 9 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.expCtc} onChange={(e) => setFormData({...formData, expCtc: e.target.value})}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Feedback / Remarks</label>
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
                            <button onClick={handleSaveFollowup} className="bg-[#103c7f] hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 size={14}/> Save Followup
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
                                    value={formData.profile} 
                                    onChange={(e) => setFormData({...formData, profile: e.target.value, slot: ""})}
                                >
                                    <option value="">-- Choose Profile & Slot --</option>
                                    <option value="Frontend Developer (TechCorp) • 10:00 - 11:30">Frontend Developer (TechCorp) • 10:00 - 11:30</option>
                                    <option value="Frontend Developer (TechCorp) • 12:00 - 01:30">Frontend Developer (TechCorp) • 12:00 - 01:30</option>
                                    <option value="B2B Sales Exec (Global Corp) • 02:00 - 03:30">B2B Sales Exec (Global Corp) • 02:00 - 03:30</option>
                                    <option value="Java Developer (Startup Inc) • Other">Java Developer (Startup Inc) • Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Apply Date</label>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Calling Date</label>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Relevant Experience</label>
                                <input 
                                    type="text" placeholder="e.g. 2 Yrs" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.relExp} onChange={(e) => setFormData({...formData, relExp: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Candidate Status</label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="">-- Select Status --</option>
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Current CTC</label>
                                <input 
                                    type="text" placeholder="e.g. 6 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.currCtc} onChange={(e) => setFormData({...formData, currCtc: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Expected CTC</label>
                                <input 
                                    type="text" placeholder="e.g. 9 LPA" 
                                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={formData.expCtc} onChange={(e) => setFormData({...formData, expCtc: e.target.value})}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Feedback / Remarks</label>
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
                            <button onClick={handleUpdateFollowup} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 size={14}/> Update Details
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}