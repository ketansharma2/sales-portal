"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, History, User, Plus, Send, Trash2, Building2,
    Calendar, Phone, Briefcase, MapPin, IndianRupee, Clock,
    FileText, CheckCircle2, MessageSquareText, AlertCircle, Bookmark,X , Edit
} from "lucide-react";

// --- MOCK DATA ---




export default function CandidateHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const candidateId = params.id;
    const [jobOptions, setJobOptions] = useState([]);

    // --- STATE ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTLModalOpen, setIsTLModalOpen] = useState(false);
    const [selectedFollowupId, setSelectedFollowupId] = useState(null);
     const [tlDetails, setTlDetails] = useState(null);

   // Fetch current user ID on mount
   useEffect(() => {
     const fetchCurrentUser = async () => {
       try {
         const session = JSON.parse(localStorage.getItem('session') || '{}');
         const token = session.access_token;
         if (!token) return;

         const res = await fetch('/api/auth/get-current-user', {
           headers: { 'Authorization': `Bearer ${token}` }
         });
         const data = await res.json();
         if (data.user_id) {
           setCurrentUserId(data.user_id);
         }
       } catch (err) {
         console.error('Error fetching current user:', err);
       }
     };
     fetchCurrentUser();
   }, []);
    useEffect(() => {
  const fetchFollowupHistory = async () => {
    try {
      setIsLoadingFollowups(true);

      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session.access_token;

      if (!token) {
        alert("Please login first");
        return;
      }

      const res = await fetch(
        `/api/jobpost/parsing/history?parsing_id=${candidateId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      console.log('result',result);
      if (!res.ok) {
         console.error("API ERROR FULL:", result);
        throw new Error(result.error || "Failed to fetch followups");
       

      }
       
      // 🔥 Use API response directly (already formatted)
       const formattedData = result.data.map((item) => ({
         ...item,
       
       
       }));

      setFollowups(formattedData);

    } catch (err) {
      console.error(err);
      alert("Error loading followups");
    } finally {
      setIsLoadingFollowups(false);
    }
  };

   fetchFollowupHistory();
   }, [candidateId]);

    
useEffect(() => {
    console.log("candidateId",candidateId);
  const fetchFollowups = async () => {
    try {
      setIsLoadingFollowups(true);

        const session = JSON.parse(localStorage.getItem('session') || '{}')
            const token = session.access_token

            if (!token) {
                alert("Please login first")
                return
            }

      const res = await fetch("/api/jobpost/parsing/history/client_profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const result = await res.json();
    

      if (!res.ok) {
        throw new Error(result.error || "Failed to fetch");
      }


      setJobOptions(result.data); // ✅ store jobs

     
    } catch (err) {
      console.error(err);
      alert("Error loading data");
    } 
  };

   fetchFollowups();
}, [candidateId]);
    
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
             client_name: row.company_name || '',
             slot: row.slot || '',
             parsing_id: candidateId,
             postDate: row.postDate && row.postDate !== '-' ? row.postDate.split('T')[0] : '',
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
         if (!formData.status || !formData.applyDate || !formData.callingDate || 
             !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
             alert("Please fill all mandatory fields marked with *");
             return;
         }

         setIsUpdatingFollowup(true);
         
         try {
           const session = JSON.parse(localStorage.getItem("session") || "{}");
           const token = session.access_token;

           const res = await fetch("/api/jobpost/parsing/history/followup", {
             method: "PUT",
             headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
             },
             body: JSON.stringify({
               conversation_id: editId,
               ...formData
             })
           });

           const result = await res.json();

           if (!res.ok) {
             throw new Error(result.error || "Failed to update followup");
           }

           // Update UI with returned data or merge
           setFollowups(prev => prev.map(f => 
             f.id === editId 
               ? { ...f, 
                   req_id: formData.req_id,
                   profile: formData.profile,
                   company_name: formData.client_name,
                   applyDate: formData.applyDate,
                   callingDate: formData.callingDate,
                   relExp: formData.relExp,
                   currCtc: formData.currCtc,
                   expCtc: formData.expCtc,
                   status: formData.status,
                   feedback: formData.feedback,
                   slot: formData.slot
                 } 
               : f
           ));
           setIsEditModalOpen(false);
           setEditId(null);
         } catch (err) {
           console.error(err);
           alert("Error: " + err.message);
         } finally {
           setIsUpdatingFollowup(false);
         }
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
         slot: "",
         applyDate: getToday(), 
         callingDate: getToday(),
         relExp: "", currCtc: "", expCtc: "",
         status: "", feedback: ""
     };
    const [formData, setFormData] = useState(initialForm);

     const [workbenchOptions, setWorkbenchOptions] = useState([]);
     const [isLoadingWorkbench, setIsLoadingWorkbench] = useState(false);
     const [currentUserId, setCurrentUserId] = useState(null);

    // Fetch workbench data on mount (MOCK)
   
    // --- FOLLOWUPS STATE ---
    const [followups, setFollowups] = useState([]);
    const [isLoadingFollowups, setIsLoadingFollowups] = useState(true);

    // Fetch existing followups (MOCK)
  

 
    // --- HANDLERS ---
    const handleAddOpen = () => {
        setFormData(initialForm);
        setIsAddModalOpen(true);
    };

    const [isSavingFollowup, setIsSavingFollowup] = useState(false);

    const handleSaveFollowup = async () => {
  if (!formData.req_id || !formData.status || !formData.applyDate || !formData.callingDate ||
      !formData.relExp || !formData.currCtc || !formData.expCtc || !formData.feedback) {
    alert("Please fill all mandatory fields");
    return;
  }

  try {
    setIsSavingFollowup(true);

    const session = JSON.parse(localStorage.getItem("session") || "{}");
    const token = session.access_token;

    const res = await fetch("/api/jobpost/parsing/history/followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        ...formData
      })
    });

     const result = await res.json();

     if (!res.ok) {
       throw new Error(result.error || "Failed to save");
     }

     // ✅ Update UI instantly - map response to UI format
     const newFollowup = {
       id: result.data.conversation_id,
       req_id: formData.req_id,
       profile: formData.profile,
       company_name: formData.client_name,
       applyDate: formData.applyDate,
       callingDate: formData.callingDate,
       relExp: formData.relExp,
       currCtc: formData.currCtc,
       expCtc: formData.expCtc,
       status: formData.status,
       feedback: formData.feedback,
       slot: formData.slot || null,
       rc_id: result.data.user_id,
       rc_name: "You",
       isTracker: false
     };

     setFollowups(prev => [newFollowup, ...prev]);
    
     setIsAddModalOpen(false);
     setFormData(initialForm);

    alert("Followup added successfully");

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setIsSavingFollowup(false);
  }
};

    const [isDeleting, setIsDeleting] = useState(false);

     const handleDelete = async (id) => {
         if (!window.confirm("Are you sure you want to delete this followup?")) return;
         setIsDeleting(true);
         try {
           const session = JSON.parse(localStorage.getItem("session") || "{}");
           const token = session.access_token;

           const res = await fetch(`/api/jobpost/parsing/history/followup?conversation_id=${id}`, {
             method: "DELETE",
             headers: {
               "Authorization": `Bearer ${token}`
             }
           });

           const result = await res.json();

           if (!res.ok) {
             throw new Error(result.error || "Failed to delete");
           }

           setFollowups(prev => prev.filter(f => f.id !== id));
         } catch (err) {
           console.error(err);
           alert("Error: " + err.message);
         } finally {
           setIsDeleting(false);
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
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Calling Date</th>
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
                                        {row.callingDate && row.callingDate !== '-' ? (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">
                                                <Calendar size={10} className="text-blue-500" />
                                                <span>{row.callingDate}</span>
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
                                          const selectedJob = jobOptions.find(
     job => String(job.id) === String(e.target.value)
   );
                                           if (selectedJob) {
                                               setFormData({
                                                   ...formData,
                                                   req_id: selectedJob.id,
                                                   client_name: selectedJob.client_name,
                                                   profile: selectedJob.job_title
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
                                       jobOptions
   .filter(job => {
     const jobDate = new Date(job.posted_date).toISOString().split('T')[0];
     return jobDate === formData.postDate;
   })
   .map(job => (
     <option key={job.id} value={job.id}>
       {job.client_name} • {job.job_title}• {job.sector}
     </option>
   ))
                                     )}
                                      {/* Show message if no jobs found for that date */}
                                      {!isLoadingWorkbench && formData.postDate && jobOptions
   .filter(job => {
     const jobDate = new Date(job.posted_date).toISOString().split('T')[0];
     return jobDate === formData.postDate;
   }).length === 0 && (
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
   className="w-full bg-white border border-slate-200 text-sm font-bold rounded-lg px-3 py-2.5"
   value={formData.req_id || ""}
   disabled={!formData.postDate}
   onChange={(e) => {
     const selectedJob = jobOptions.find(j => String(j.id) === String(e.target.value));

     if (selectedJob) {
       setFormData({
         ...formData,
         req_id: selectedJob.id,
         client_name: selectedJob.client_name,
         profile: selectedJob.job_title,
         sector: selectedJob.sector
       });
     }
   }}
>
   <option value="">-- Choose Profile --</option>

    {jobOptions
      .filter(job => {
        const jobDate = new Date(job.posted_date).toISOString().split('T')[0];
        return jobDate === formData.postDate;
      })
      .map(job => (
        <option key={job.id} value={job.id}>
          {job.client_name} • {job.job_title} • ({job.sector})
        </option>
      ))
    }

    {!isLoadingWorkbench &&
      formData.postDate &&
      jobOptions.filter(j => {
        const jobDate = new Date(j.posted_date).toISOString().split('T')[0];
        return jobDate === formData.postDate;
      }).length === 0 && (
        <option disabled>No postings found</option>
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