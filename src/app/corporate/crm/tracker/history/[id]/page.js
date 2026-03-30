"use client";
import { useState, useEffect } from "react";
import { 
    Building2, History, Calendar, CheckCircle2, 
    X, FileText, Briefcase, MapPin, GraduationCap,
    ArrowLeft, Clock, Plus, Eye, AlignLeft
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function TrackerHistoryPage() {
    const params = useParams();
    const router = useRouter();
    
    // --- STATE ---
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [modalType, setModalType] = useState(null); // 'add_journey', 'view_journey'
    const [selectedHistoryRow, setSelectedHistoryRow] = useState(null);
    const [savingJourney, setSavingJourney] = useState(false);
    
    // Form State
    const [journeyForm, setJourneyForm] = useState({
        status: "", 
        actionDate: new Date().toISOString().split('T')[0],
        remark: ""
    });

    // --- MOCK DATA ---
    useEffect(() => {
        const fetchEmailHistory = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch(`/api/corporate/crm/emails/history/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    // Build candidate object with email history
                    const candidateData = {
                        id: parseInt(params.id),
                        name: result.candidateInfo?.name || '-',
                        profile: result.candidateInfo?.profile || '-',
                        location: result.candidateInfo?.location || '-',
                        qualification: result.candidateInfo?.qualification || '-',
                        experience: result.candidateInfo?.experience || '-',
                        cv_url: result.candidateInfo?.cv_url || '',
                        emailHistory: result.data
                    };
                    setCandidate(candidateData);
                    
                    // Fetch interview journeys for each email history row
                    fetchInterviewJourneys(result.data);
                } else {
                    // No records found
                    setCandidate(null);
                }
            } catch (error) {
                console.error('Error fetching email history:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (params.id) {
            fetchEmailHistory();
        }
    }, [params.id]);

    // --- FETCH INTERVIEW JOURNEYS ---
    const fetchInterviewJourneys = async (emailHistoryData) => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            // Update each row with its journey data from the API
            const updatedHistory = await Promise.all(
                emailHistoryData.map(async (row) => {
                    const response = await fetch(`/api/corporate/crm/interview-journey?email_draft_id=${row.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    
                    // Map API field names to UI expected field names
                    const mappedJourney = result.success && result.data 
                        ? result.data.map(item => ({
                            id: item.id,
                            status: item.interview_status,
                            date: item.date,
                            remark: item.client_remark
                          }))
                        : [];
                    
                    return {
                        ...row,
                        journey: mappedJourney
                    };
                })
            );
            
            setCandidate(prev => ({
                ...prev,
                emailHistory: updatedHistory
            }));
        } catch (error) {
            console.error('Error fetching interview journeys:', error);
        }
    };
    const openAddJourneyModal = (historyRow) => {
        setSelectedHistoryRow(historyRow);
        setJourneyForm({ 
            status: "", 
            actionDate: new Date().toISOString().split('T')[0], 
            remark: "" 
        });
        setModalType('add_journey');
    };

    const openViewJourneyModal = (historyRow) => {
        setSelectedHistoryRow(historyRow);
        setModalType('view_journey');
    };

    const handleSaveJourney = async () => {
        if (!journeyForm.status) return alert("Please select a tracker status.");

        setSavingJourney(true);
        
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const response = await fetch('/api/corporate/crm/interview-journey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email_draft_id: selectedHistoryRow.id,
                    interview_status: journeyForm.status,
                    client_remark: journeyForm.remark || "Status updated.",
                    date: journeyForm.actionDate
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Fetch latest journey data from API after save
                const fetchResponse = await fetch(`/api/corporate/crm/interview-journey?email_draft_id=${selectedHistoryRow.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const fetchResult = await fetchResponse.json();
                
                // Map API field names to UI expected field names
                const mappedJourney = fetchResult.success && fetchResult.data 
                    ? fetchResult.data.map(item => ({
                        id: item.id,
                        status: item.interview_status,
                        date: item.date,
                        remark: item.client_remark
                      }))
                    : [];
                
                // Update the specific history row's journey array
                setCandidate(prev => ({
                    ...prev,
                    emailHistory: prev.emailHistory.map(h => 
                        h.id === selectedHistoryRow.id 
                        ? { ...h, journey: mappedJourney }
                        : h
                    )
                }));
                
                setModalType(null);
            } else {
                alert("Failed to save journey: " + result.message);
            }
        } catch (error) {
            console.error('Error saving journey:', error);
            alert("Failed to save journey");
        } finally {
            setSavingJourney(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading History...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                <div>
                    <button 
                        onClick={() => router.back()}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                    >
                        <ArrowLeft size={14}/> Back to Client Tracker
                    </button>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                            <History size={18} />
                        </div>
                        Email Tracker History
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 xl:ml-10">
                        {candidate.name} • Shared by TL {candidate.tlName} on {candidate.trackerShareDate}
                    </p>
                </div>
            </div>

            {/* --- EMAIL HISTORY TABLE --- */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1300px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Share Date</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Qualification</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[200px]">CRM Feedback (Email Note)</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200 w-44">Interview Journey</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {candidate.emailHistory && candidate.emailHistory.length > 0 ? (
                                candidate.emailHistory.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        
                                        {/* Date */}
                                        <td className="py-4 px-4">
                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                                                <Calendar size={12}/> {row.date}
                                            </p>
                                        </td>

                                        {/* Target Company */}
                                        <td className="py-4 px-4">
                                            <p className="text-xs font-black text-indigo-700 flex items-center gap-1.5">
                                                <Building2 size={12}/> {row.companyName}
                                            </p>
                                        </td>

                                        {/* Core Details */}
                                        <td className="py-4 px-4"><p className="text-xs font-black text-slate-800">{candidate.name}</p></td>
                                        <td className="py-4 px-4"><p className="text-[11px] font-black text-slate-700">{candidate.profile}</p></td>
                                        <td className="py-4 px-4"><p className="text-[11px] font-bold text-slate-600">{candidate.location}</p></td>
                                        <td className="py-4 px-4"><p className="text-[11px] font-bold text-slate-600">{candidate.qualification}</p></td>
                                        <td className="py-4 px-4"><p className="text-[11px] font-black text-slate-800">{row.experience || '-'}</p></td>

                                        {/* CRM Feedback (Email Note) */}
                                        <td className="py-4 px-4">
                                            <div className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[10px] font-medium text-slate-600 italic shadow-sm truncate max-w-[200px]" title={row.crmFeedback}>
                                                "{row.crmFeedback || "No remarks added during draft."}"
                                            </div>
                                        </td>

                                        {/* Action Buttons (Sticky Right) */}
                                        <td className="py-4 px-4 sticky right-0 bg-white border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)]">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => openAddJourneyModal(row)}
                                                    className="flex-1 py-1.5 px-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                    title="Add Status"
                                                >
                                                    <Plus size={12}/> Add
                                                </button>
                                                <button 
                                                    onClick={() => openViewJourneyModal(row)}
                                                    className="flex-1 py-1.5 px-2 rounded bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                    title="View Timeline"
                                                >
                                                    <Eye size={12}/> View
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="py-12 text-center">
                                        <AlignLeft size={32} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No email tracker history available for this candidate.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL 1: ADD JOURNEY STATUS */}
            {/* ========================================================= */}
            {modalType === 'add_journey' && selectedHistoryRow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border-4 border-white animate-in zoom-in-95">
                        
                        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={16}/> Add Journey Status
                                </h2>
                                <p className="text-[10px] text-indigo-200 font-bold mt-1 uppercase tracking-widest">
                                    {candidate.name} • {selectedHistoryRow.companyName}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-indigo-200 bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            <div className="space-y-5">
                                {/* Status Dropdown */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Interview Status <span className="text-rose-500">*</span></label>
                                    <select 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                                        value={journeyForm.status} onChange={(e) => setJourneyForm({...journeyForm, status: e.target.value})}
                                    >
                                        <option value="">-- Select Status --</option>
                                        <option value="Shortlisted">Shortlisted</option>
                                        <option value="Selected">Selected</option>
                                        <option value="Interviewed">Interviewed</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Joining">Joining</option>
                                        <option value="Pipeline">Pipeline</option>
                                        <option value="Ghosted">Ghosted</option>
                                    </select>
                                </div>

                                {/* Action Date */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Action Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input 
                                            type="date" 
                                            className="w-full pl-9 pr-3 py-2.5 text-sm font-bold bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                                            value={journeyForm.actionDate} onChange={(e) => setJourneyForm({...journeyForm, actionDate: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Remarks Textarea */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Client Feedback / Remark</label>
                                    <textarea 
                                        rows="4" placeholder="E.g., Cleared L1, L2 scheduled for tomorrow..." 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                                        value={journeyForm.remark} onChange={(e) => setJourneyForm({...journeyForm, remark: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                            <button onClick={() => setModalType(null)} className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 hover:text-slate-700 bg-slate-100 py-2.5 rounded-lg transition-colors">Cancel</button>
                            <button 
                                                    onClick={handleSaveJourney} 
                                                    disabled={savingJourney}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {savingJourney ? (
                                                        <>
                                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 size={14}/> Save Status
                                                        </>
                                                    )}
                                                </button>
                        </div>
                        
                    </div>
                </div>
            )}

           {/* ========================================================= */}
            {/* MODAL 2: VIEW JOURNEY TIMELINE */}
            {/* ========================================================= */}
            {modalType === 'view_journey' && selectedHistoryRow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[500px] overflow-hidden flex flex-col border-4 border-white animate-in zoom-in-95">
                        
                        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16}/> Interview Journey Timeline
                                </h2>
                                <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">
                                    {candidate.name} • {selectedHistoryRow.companyName}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-slate-300 bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                            {selectedHistoryRow.journey && selectedHistoryRow.journey.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedHistoryRow.journey.map((step, i) => (
                                        <div key={step.id} className="relative pl-6 border-l-2 border-indigo-200 pb-2 last:border-l-0 last:pb-0">
                                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                                            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm -mt-2">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">{step.status}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {step.date}</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-600 italic">"{step.remark}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                    <History size={32} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-500">No journey updates yet.</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Click 'Add Journey' to log status.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}