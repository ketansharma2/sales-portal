"use client";
import { useState, useEffect } from "react";
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
    const [isTLModalOpen, setIsTLModalOpen] = useState(false);
    const [selectedFollowupId, setSelectedFollowupId] = useState(null);
    const [tlDetails, setTlDetails] = useState(null);
    // --- EDIT STATE & HANDLERS ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const handleEditOpen = (row) => {
        const today = new Date().toISOString().split('T')[0];
        if (row.callingDate !== today) {
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

    const handleUpdateFollowup = async () => {
        // Validate all mandatory fields
        if (!formData.status || !formData.applyDate || !formData.callingDate || 
            !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
            alert("Please fill all mandatory fields marked with *");
            return;
        }

        setIsUpdatingFollowup(true);
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const response = await fetch('/api/corporate/recruiter/candidate-history', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: editId,
                    candidate_status: formData.status,
                    remarks: formData.feedback,
                    relevant_exp: formData.relExp || null,
                    curr_ctc: formData.currCtc || null,
                    exp_ctc: formData.expCtc || null,
                    apply_date: formData.applyDate,
                    calling_date: formData.callingDate,
                    slot: formData.slot || null
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update the followup in the list
                setFollowups(followups.map(f => f.id === editId ? { ...f, ...formData } : f));
                setIsEditModalOpen(false);
                setEditId(null);
            } else {
                alert(result.message || "Failed to update followup");
            }
        } catch (error) {
            console.error('Error updating followup:', error);
            alert("An error occurred while updating. Please try again.");
        } finally {
            setIsUpdatingFollowup(false);
        }
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
        req_id: "",
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

    // Workbench data for profile/slot dropdown
    const [workbenchOptions, setWorkbenchOptions] = useState([]);
    const [isLoadingWorkbench, setIsLoadingWorkbench] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Fetch workbench data on mount
    useEffect(() => {
        const fetchWorkbenchData = async () => {
            setIsLoadingWorkbench(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                const response = await fetch('/api/corporate/recruiter/workbench-dropdown', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    // Transform data for dropdown options - show job_title, slot and company_name
                    const options = result.data.map(item => ({
                        value: item.req_id,
                        label: item.job_title && item.slot 
                            ? `${item.job_title} • ${item.slot}${item.company_name ? ` (${item.company_name})` : ''}` 
                            : item.job_title || 'Unknown Profile'
                    }));
                    setWorkbenchOptions(options);
                }
            } catch (error) {
                console.error('Error fetching workbench data:', error);
            } finally {
                setIsLoadingWorkbench(false);
            }
        };
        fetchWorkbenchData();
    }, []);

    // --- FOLLOWUPS STATE ---
    const [followups, setFollowups] = useState([]);
    const [isLoadingFollowups, setIsLoadingFollowups] = useState(true);

    // Fetch existing followups from database
    useEffect(() => {
        const fetchFollowups = async () => {
            setIsLoadingFollowups(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                const response = await fetch(`/api/corporate/recruiter/candidate-history?parsing_id=${candidateId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success && result.data) {
                    // Transform database records to UI format
                    const transformed = result.data.map((item, idx) => ({
                        id: item.conversation_id,
                        req_id: item.req_id,
                        profile: item.job_title || '-',
                        company_name: item.company_name || null,
                        slot: item.slot || '-',
                        applyDate: item.apply_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : getToday()),
                        callingDate: item.calling_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : getToday()),
                        relExp: item.relevant_exp ? `${item.relevant_exp}` : '',
                        currCtc: item.curr_ctc ? `${item.curr_ctc}` : '',
                        expCtc: item.exp_ctc ? `${item.exp_ctc}` : '',
                        status: item.candidate_status || '',
                        feedback: item.remarks || '',
                        isTracker: !!item.sent_to_tl,
                        tl_name: item.tl_name || '',
                        rc_name: item.rc_name || '-',
                        rc_id: item.user_id || null
                    }));
                    setFollowups(transformed);
                }
            } catch (error) {
                console.error('Error fetching followups:', error);
            } finally {
                setIsLoadingFollowups(false);
            }
        };
        fetchFollowups();
    }, [candidateId]);

    // Fetch TL details on page load
    useEffect(() => {
        const fetchTLDetails = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                // Get current user details first
                const userResponse = await fetch('/api/auth/get-current-user', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                
                if (userData.user_id) {
                    setCurrentUserId(userData.user_id);
                    // Get TL details
                    const tlResponse = await fetch(`/api/corporate/recruiter/get-tl-details?user_id=${userData.user_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const tlResult = await tlResponse.json();
                    
                    if (tlResult.success && tlResult.data) {
                        setTlDetails(tlResult.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching TL details:', error);
            }
        };
        fetchTLDetails();
    }, []);

    // --- HANDLERS ---
    const handleAddOpen = () => {
        setFormData(initialForm);
        setIsAddModalOpen(true);
    };

    const [isSavingFollowup, setIsSavingFollowup] = useState(false);

    const handleSaveFollowup = async () => {
        // Validate all mandatory fields
        if (!formData.profile || !formData.status || !formData.applyDate || !formData.callingDate || 
            !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
            alert("Please fill all mandatory fields marked with *");
            return;
        }

        console.log('Saving formData:', formData);
        console.log('Slot being saved:', formData.slot);

        setIsSavingFollowup(true);
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const response = await fetch('/api/corporate/recruiter/candidate-history', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parsing_id: candidateId,
                    req_id: formData.req_id || null,
                    candidate_status: formData.status,
                    remarks: formData.feedback,
                    relevant_exp: formData.relExp || null,
                    curr_ctc: formData.currCtc || null,
                    exp_ctc: formData.expCtc || null,
                    apply_date: formData.applyDate,
                    calling_date: formData.callingDate,
                    slot: formData.slot || null
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add new followup to the list
                const newFollowup = {
                    ...formData,
                    id: result.data?.conversation_id || Date.now(),
                    isTracker: false
                };
                setFollowups([newFollowup, ...followups]);
                setIsAddModalOpen(false);
            } else {
                alert(result.message || "Failed to save followup");
            }
        } catch (error) {
            console.error('Error saving followup:', error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSavingFollowup(false);
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure you want to delete this followup?")) {
            setIsDeleting(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch(`/api/corporate/recruiter/candidate-history?conversation_id=${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    setFollowups(followups.filter(f => f.id !== id));
                } else {
                    alert(result.message || "Failed to delete followup");
                }
            } catch (error) {
                console.error('Error deleting followup:', error);
                alert("An error occurred while deleting. Please try again.");
            } finally {
                setIsDeleting(false);
            }
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

    const confirmSendToTL = async () => {
        if (!selectedFollowupId || !tlDetails) return;
        
        setIsSendingToTL(true);
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const today = new Date().toISOString().split('T')[0];
            
            const response = await fetch('/api/corporate/recruiter/candidate-history', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: selectedFollowupId,
                    sent_to_tl: tlDetails.user_id,
                    sent_date: today
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Refetch the data to get updated tl_name
                setIsLoadingFollowups(true);
                try {
                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                    const token = session.access_token;
                    const response = await fetch(`/api/corporate/recruiter/candidate-history?parsing_id=${candidateId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const resultData = await response.json();
                    if (resultData.success && resultData.data) {
                        const transformed = resultData.data.map((item, idx) => ({
                            id: item.conversation_id,
                            req_id: item.req_id,
                            profile: item.job_title || '-',
                            company_name: item.company_name ,
                            slot: item.slot || '-',
                            applyDate: item.apply_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : getToday()),
                            callingDate: item.calling_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : getToday()),
                            relExp: item.relevant_exp ? `${item.relevant_exp}` : '',
                            currCtc: item.curr_ctc ? `${item.curr_ctc}` : '',
                            expCtc: item.exp_ctc ? `${item.exp_ctc}` : '',
                            status: item.candidate_status || '',
                            feedback: item.remarks || '',
                            isTracker: !!item.sent_to_tl,
                            tl_name: item.tl_name || '',
                            rc_name: item.rc_name || '-',
                            rc_id: item.user_id || null
                        }));
                        setFollowups(transformed);
                    }
                } catch (error) {
                    console.error('Error refetching followups:', error);
                    // Fallback to local update
                    setFollowups(followups.map(f => f.id === selectedFollowupId ? { ...f, isTracker: true, tl_name: tlDetails.name } : f));
                } finally {
                    setIsLoadingFollowups(false);
                }
                setIsTLModalOpen(false);
                setSelectedFollowupId(null);
            } else {
                alert(result.message || "Failed to send to TL");
            }
        } catch (error) {
            console.error('Error sending to TL:', error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSendingToTL(false);
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
                                <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-10">#</th>
                                <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">RC Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Client/Profile & Slot</th>
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
                                    <td className="py-3 px-3 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                                    
                                    {/* RC Name */}
                                    <td className="py-3 px-3">
                                        <span className="text-[10px] font-black text-slate-600 uppercase">{row.rc_name || '-'}</span>
                                    </td>
                                    
                                    {/* Display Profile & Slot */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <p className="text-xs font-black text-slate-800 whitespace-normal min-w-[150px]">{row.profile}</p>
                                            {row.company_name && row.company_name !== '-' && (
                                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{row.company_name}</span>
                                            )}
                                        </div>
                                        {row.slot && row.slot !== '-' && (
                                            <p className="text-[11px] font-bold text-blue-600 mt-0.5">{row.slot}</p>
                                        )}
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

                                    {/* Action Buttons (Edit, Delete, Send) - Only show for own conversations */}
                                    <td className="py-3 px-4 text-center border-l border-slate-200">
                                        {row.rc_id === currentUserId ? (
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    onClick={() => handleEditOpen(row)}
                                                    disabled={row.isTracker}
                                                    className={`w-7 h-7 rounded border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${row.isTracker ? 'bg-slate-50 text-slate-300 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                                                    title={row.isTracker ? "Cannot edit - already sent to TL" : "Edit Followup"}
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
                                                    disabled={isDeleting || row.isTracker}
                                                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${row.isTracker ? 'bg-slate-50 text-slate-300 border border-slate-200' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'}`}
                                                    title={row.isTracker ? "Cannot delete - already sent to TL" : "Delete Followup"}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-400 italic">Other's</span>
                                        )}
                                    </td>

                                    {/* Tracker Status Column */}
                                    <td className="py-3 px-4 sticky right-0 bg-white border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-32 text-center">
                                        {row.isTracker ? (
                                            <div>
                                                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-max mx-auto">
                                                    <CheckCircle2 size={10}/> Sent to TL
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{row.tl_name || 'Unknown'}</p>
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
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                     Select Assigned Profile & Slot <span className="text-red-500">*</span>
                                 </label>
                                  <select 
                                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                                      value={formData.req_id} 
                                      onChange={(e) => {
                                          const selectedOption = workbenchOptions.find(opt => opt.value === e.target.value);
                                          if (selectedOption) {
                                              // Split the label - format: "Profile • Slot (Company Name)" or "Profile • Slot"
                                              const label = selectedOption.label;
                                              console.log('Selected label:', label);
                                              const slotPart = label.split(' • ')[1] || '';
                                              console.log('Slot part before:', slotPart);
                                              // Remove company name from slot - get text before first '('
                                              const firstParenIndex = slotPart.indexOf('(');
                                              const slot = firstParenIndex > -1 ? slotPart.substring(0, firstParenIndex).trim() : slotPart.trim();
                                              console.log('Slot after clean:', slot);
                                              setFormData({
                                                  ...formData,
                                                  req_id: e.target.value,
                                                  profile: label.split(' • ')[0] || '',
                                                  slot: slot
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
                                             <option value="" disabled>No profiles available for today</option>
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
                                            <option value="" disabled>No profiles available for today</option>
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