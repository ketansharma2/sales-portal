"use client";
import { useState ,useEffect} from "react";
import { 
    FileText, Eye, Search, Filter, MapPin, 
    Calendar, ShieldCheck, Edit, Send, CheckCircle2,
    X, Clock, MessageSquare, User, FileCheck, AlertCircle, Loader2, File
} from "lucide-react";
import jsPDF from "jspdf";

// CV Preview Component - Handles PDF, Images, and Word documents
function CVPreview({ url, name }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileType, setFileType] = useState(null);

    useEffect(() => {
        const fetchFileAsBlob = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch file: ${response.status}`);
                }
                
                const blob = await response.blob();
                setFileType(blob.type);
                
                // For images, convert to PDF first
                if (blob.type.startsWith('image/')) {
                    const img = new Image();
                    const imgUrl = URL.createObjectURL(blob);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = imgUrl;
                    });
                    
                    const orientation = img.width > img.height ? 'landscape' : 'portrait';
                    const pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'px',
                        format: [img.width, img.height]
                    });
                    
                    pdf.addImage(imgUrl, 'JPEG', 0, 0, img.width, img.height);
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    setBlobUrl(pdfUrl);
                } else {
                    const fileBlobUrl = URL.createObjectURL(blob);
                    setBlobUrl(fileBlobUrl);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching file:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (url) {
            fetchFileAsBlob();
        }

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [url]);

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="ml-3 text-sm font-bold text-slate-500">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-slate-500 p-4">
                <File size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-black uppercase tracking-widest mb-1">Error Loading File</p>
                <p className="text-xs font-bold">{error}</p>
                <button
                    onClick={() => window.open(url, '_blank')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                >
                    Open in New Tab
                </button>
            </div>
        );
    }

    const isImage = fileType && fileType.startsWith('image/');
    const isWord = fileType === 'application/msword' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isWord) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-lg p-4">
                <FileText size={64} className="text-blue-500 mb-4" />
                <p className="text-sm font-bold text-slate-700 mb-2">Word Document</p>
                <p className="text-xs text-slate-500 mb-4 text-center">
                    Preview not available for Word documents.<br/>Please download to view.
                </p>
                <a 
                    href={url} 
                    download={name + '_CV.docx'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                    Download CV
                </a>
            </div>
        );
    }

    // PDF and converted images display in iframe with native PDF viewer
    return (
        <iframe
            src={blobUrl}
            className="w-full h-full border-0 rounded-lg"
            title={`CV Preview: ${name}`}
        />
    );
}

export default function TLTrackerPage() {
    // --- STATE ---
    const [trackerData, setTrackerData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalType, setModalType] = useState(null); // 'tl_update', null
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    
    // Independent state for CV Viewer so it doesn't close the TL form
    const [cvViewer, setCvViewer] = useState({ isOpen: false, source: null }); 
    
    // Loading state for Auto-Update CV
    const [isUpdatingCV, setIsUpdatingCV] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Preview state for CV redaction
    const [previewData, setPreviewData] = useState(null);

    // Form State for TL Update Modal
    const [tlForm, setTlForm] = useState({
        tlReview: "",
        cvUpdateStatus: "", // 'JD Match', 'Average Match', 'Rejected'
        updatedCvName: "",
        callResponding: "" // 'Yes', 'No'
    });

    // CRM User Selection State
    const [crmModalOpen, setCrmModalOpen] = useState(false);
    const [crmUsers, setCrmUsers] = useState([]);
    const [selectedCrmUser, setSelectedCrmUser] = useState(null);
    const [isLoadingCrmUsers, setIsLoadingCrmUsers] = useState(false);

    // Filter State
    const [recruiterFilter, setRecruiterFilter] = useState("");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [recruitersList, setRecruitersList] = useState([]);
    const [dateRange, setDateRange] = useState({
        from: "",
        to: ""
    });

    // Fetch data from API
    useEffect(() => {
        const fetchTrackerData = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                const userData = session.user || null;
                setLoggedInUser(userData);
                
                const response = await fetch('/api/corporate/tl/tracker', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    // Transform API data to UI format
                    const transformed = result.data.map((item, idx) => ({
                        id: item.conversation_id,
                        recruiterName: item.recruiter_name,
                        sentDate: item.sent_date ? item.sent_date.split('T')[0] : '-',
                        profile: item.job_title || '-',
                        slot: item.slot || '-',
                        name: item.candidate_name || '-',
                        email: item.candidate_email || '-',
                        mobile: item.candidate_phone || '-',
                        location: item.candidate_location || '-',
                        qualification: item.candidate_qualification || '-',
                        experience: item.candidate_experience ? `${item.candidate_experience} ` : '-',
                        relevantExp: item.relevant_exp ? `${item.relevant_exp} ` : '-',
                        cCTC: item.curr_ctc ? `${item.curr_ctc} ` : '-',
                        eCTC: item.exp_ctc ? `${item.exp_ctc} ` : '-',
                        feedback: item.remarks || '-',
                        cv_url: item.cv_url || '',
                        cv_parsing_id: item.cv_parsing_id || '',
                        redacted_cv_url: item.redacted_cv_url || '',
                        tlReview: item.tl_remarks || '',
                        cvUpdateStatus: item.cv_status || '',
                        tlCvName: item.redacted_cv_url || '',
                        callResponding: item.call_respond || '',
                        sentToCrm: item.sent_to_crm || null,
                        sentToCrmName: item.sent_to_crm_name || null
                    }));
                    setTrackerData(transformed);
                }
            } catch (error) {
                console.error('Error fetching tracker data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchTrackerData();
    }, []);

    // Fetch RC users on mount
    useEffect(() => {
        const fetchRcUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch('/api/corporate/tl/rc-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setRecruitersList(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch RC users:', error);
            }
        };
        
        fetchRcUsers();
    }, []);

    // Fetch CRM Users on page load
    useEffect(() => {
        const loadCrmUsers = async () => {
            setIsLoadingCrmUsers(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/corporate/tl/crm-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                if (result.success && result.data) {
                    setCrmUsers(result.data);
                }
            } catch (error) {
                console.error('Error fetching CRM users:', error);
            } finally {
                setIsLoadingCrmUsers(false);
            }
        };
        
        loadCrmUsers();
    }, []);

    // --- HANDLERS ---
    const openCVModal = (candidate, source) => {
        setSelectedCandidate(candidate);
        setCvViewer({ isOpen: true, source: source });
        // CVPreview component handles loading internally
    };

    const openTLUpdateModal = (candidate) => {
        setSelectedCandidate(candidate);
        setTlForm({
            tlReview: candidate.tlReview || "",
            cvUpdateStatus: candidate.cvUpdateStatus || "",
            updatedCvName: candidate.tlCvName || "",
            callResponding: candidate.callResponding || ""
        });
        setModalType('tl_update');
    };

    // Auto Update CV Handler - Calls the Redact CV API
    const handleAutoUpdateCV = async () => {
        if (!selectedCandidate?.cv_url) {
            alert("No CV URL found for this candidate.");
            return;
        }

        setIsUpdatingCV(true);
        setPreviewData(null);

        try {
            const cvParsingId = selectedCandidate.cv_parsing_id;
            
            if (!cvParsingId) {
                alert("No cv_parsing_id found for this candidate.\n\nCannot process CV.");
                return;
            }

            console.log("Calling Redact CV API with cv_parsing_id:", cvParsingId);
            
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;

            const response = await fetch('/api/corporate/recruiter/redact-cv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cv_parsing_id: cvParsingId
                })
            });

            console.log("Redact CV API response status:", response.status);
            
            const result = await response.json();
            console.log("Redact CV API response:", result);

            if (result.preview) {
                setPreviewData({
                    cv_parsing_id: cvParsingId,
                    emails_found: result.emails_found || [],
                    phones_found: result.phones_found || [],
                    message: result.message
                });
                setIsUpdatingCV(false);
                return;
            }

            if (result.success && result.redacted_cv_url) {
                setTlForm({ 
                    ...tlForm, 
                    updatedCvName: result.redacted_cv_url 
                });
                
                alert("CV redacted and saved successfully!\n\nRedacted CV URL: " + result.redacted_cv_url);
            } else {
                alert("Failed to redact CV.\n\nReason: " + (result.message || result.error || "Unknown error"));
                console.error("Redaction failed:", result);
            }
        } catch (error) {
            console.error("Error redacting CV:", error);
            alert("Failed to redact CV.\n\nError: " + error.message);
        } finally {
            setIsUpdatingCV(false);
        }
    };

    // Confirm CV Redaction Handler
    const handleConfirmRedaction = async () => {
        if (!previewData?.cv_parsing_id) return;

        setIsUpdatingCV(true);

        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;

            const response = await fetch('/api/corporate/recruiter/redact-cv', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cv_parsing_id: previewData.cv_parsing_id
                })
            });

            const result = await response.json();
            console.log("Confirm response:", result);

            if (result.success && result.redacted_cv_url) {
                setPreviewData(null);
                setTlForm({ 
                    ...tlForm, 
                    updatedCvName: result.redacted_cv_url 
                });
                alert("CV redacted successfully!\n\nRedacted CV URL: " + result.redacted_cv_url);
            } else {
                alert("Failed to redact CV.\n\nReason: " + (result.message || result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error confirming redacted CV:", error);
            alert("Failed to redact CV.\n\nError: " + error.message);
        } finally {
            setIsUpdatingCV(false);
        }
    };

    // Cancel preview
    const handleCancelPreview = () => {
        setPreviewData(null);
    };

    const handleSaveTLUpdate = async () => {
        if (!tlForm.cvUpdateStatus) {
            alert("Please select CV Update Status.");
            return;
        }

        setIsSaving(true);

        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            console.log('Saving evaluation:', {
                conversation_id: selectedCandidate.id,
                cv_status: tlForm.cvUpdateStatus,
                tl_remarks: tlForm.tlReview,
                call_respond: tlForm.callResponding
            });
            
            const response = await fetch('/api/corporate/tl/tracker', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: selectedCandidate.id,
                    cv_status: tlForm.cvUpdateStatus,
                    tl_remarks: tlForm.tlReview,
                    call_respond: tlForm.callResponding
                })
            });
            
            console.log('Save response status:', response.status);
            
            const result = await response.json();
            console.log('Save result:', result);
            
            if (result.success) {
                const updatedData = trackerData.map(item => {
                    if (item.id === selectedCandidate.id) {
                        return {
                            ...item,
                            tlReview: tlForm.tlReview,
                            cvUpdateStatus: tlForm.cvUpdateStatus,
                            tlCvName: tlForm.updatedCvName,
                            callResponding: tlForm.callResponding
                        };
                    }
                    return item;
                });

                setTrackerData(updatedData);
                setModalType(null);
            } else {
                alert(result.message || "Failed to save evaluation");
            }
        } catch (error) {
            console.error('Error saving evaluation:', error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToCRM = (candidate) => {
        setSelectedCandidate(candidate);
        setSelectedCrmUser(null);
        setCrmModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "JD Match": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Average Match": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Rejected": return "bg-rose-100 text-rose-700 border-rose-200";
            default: return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    const handleConfirmSendToCRM = async () => {
        if (!selectedCrmUser) {
            alert("Please select a CRM user.");
            return;
        }

        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const response = await fetch('/api/corporate/tl/tracker', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: selectedCandidate.id,
                    sent_to_crm: selectedCrmUser.user_id
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local state
                const updatedData = trackerData.map(item => 
                    item.id === selectedCandidate.id 
                        ? { 
                            ...item, 
                            isSentToCRM: true,
                            sentToCrmUserId: selectedCrmUser.user_id,
                            sentToCrmUserName: selectedCrmUser.name,
                            crmSentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        } 
                        : item
                );
                setTrackerData(updatedData);
                setCrmModalOpen(false);
                alert(`Successfully sent to ${selectedCrmUser.name}`);
            } else {
                alert(result.error || "Failed to send to CRM");
            }
        } catch (error) {
            console.error('Error sending to CRM:', error);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-3 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        Tracker Panel
                    </h1>
                  
                </div>
            </div>

            {/* --- TABLE CONTAINER --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Table Toolbar */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search size={14} className="absolute left-3 top-2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by Candidate, Profile..." 
                                className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                        </div>
                        <select 
                            className="w-full sm:w-48 py-1.5 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
                            value={recruiterFilter}
                            onChange={(e) => setRecruiterFilter(e.target.value)}
                        >
                            <option value="">All Recruiters</option>
                            {recruitersList.map(r => (
                                <option key={r.user_id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="w-full sm:w-32 py-1.5 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            />
                            <span className="text-xs font-bold text-slate-400">to</span>
                            <input 
                                type="date" 
                                className="w-full sm:w-32 py-1.5 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            />
                        </div>
                    </div>
                    
                    {/* Date Range Display */}
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {dateRange.from && dateRange.to ? (
                            <span>Filter: {dateRange.from} to {dateRange.to}</span>
                        ) : dateRange.from ? (
                            <span>From: {dateRange.from}</span>
                        ) : dateRange.to ? (
                            <span>To: {dateRange.to}</span>
                        ) : (
                            <span>No date filter</span>
                        )}
                    </div>
                    
                </div>

                {/* Table Wrapper - Compact */}
                <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar pb-2 relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                        
                        {/* Sticky Header */}
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900 text-white">
                                <th colSpan="8" className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 bg-blue-900/40 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-blue-200"><User size={12}/> Recruiter (RC) Section</div>
                                </th>
                                <th colSpan="2" className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest bg-amber-900/40 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-amber-200"><ShieldCheck size={12}/> Team Lead (TL) Section</div>
                                </th>
                            </tr>
                            <tr className="bg-slate-800 text-white">
                                {/* RC Columns */}
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] w-10 text-center border-t border-slate-700">RC CV</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-700">Recruiter Info</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-700">Profile & Slot</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-700">Candidate Info</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-700">Loc & Qual</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-700">Exp (T/R)</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest text-center border-t border-slate-700">CTC (C/E)</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest max-w-[150px] border-r border-slate-700 border-t border-slate-700">RC Feedback</th>
                                
                                {/* TL Columns */}
                                <th className="py-2 px-3 text-[10px] font-black text-amber-300 uppercase tracking-widest border-t border-slate-700 bg-slate-800/80 w-52">TL Evaluation & Updated CV</th>
                                <th className="py-2 px-3 text-[10px] font-black uppercase tracking-widest sticky right-0 bg-slate-900 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)] text-center border-l border-slate-700 border-t border-slate-700 w-32">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {trackerData.filter(row => {
                                const matchesRecruiter = !recruiterFilter || row.recruiterName === recruiterFilter;
                                
                                let matchesDate = true;
                                if ((dateRange.from || dateRange.to) && row.sentDate !== '-') {
                                    const rowDateStr = row.sentDate;
                                    const fromDateStr = dateRange.from;
                                    const toDateStr = dateRange.to;
                                    
                                    matchesDate = (!fromDateStr || rowDateStr >= fromDateStr) && 
                                                 (!toDateStr || rowDateStr <= toDateStr);
                                }
                                return matchesRecruiter && matchesDate;
                            }).map((row) => (
                                <tr key={row.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    
                                    {/* 1. RC CV View Button */}
                                    <td className="py-2 px-3 sticky left-0 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center">
                                        <button 
                                            onClick={() => openCVModal(row, 'rc')}
                                            disabled={!row.cv_url}
                                            className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center mx-auto transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={row.cv_url ? "View Recruiter's CV" : "No CV available"}
                                        >
                                            <FileText size={12} />
                                        </button>
                                    </td>

                                    {/* RC SECTION CELLS */}
                                    <td className="py-2 px-3 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[11px] font-black text-slate-800">{row.recruiterName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={8}/> {row.sentDate}
                                        </p>
                                    </td>

                                    <td className="py-2 px-3 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[10px] font-black text-indigo-700 uppercase">{row.profile}</p>
                                        <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1"><Clock size={9}/> {row.slot}</p>
                                    </td>

                                    <td className="py-2 px-3 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[11px] font-black text-slate-800">{row.name}</p>
                                        <div className="flex flex-col text-[9px] text-slate-500 font-bold gap-0.5">
                                            <span>{row.mobile}</span>
                                            <span className="lowercase text-blue-500">{row.email}</span>
                                        </div>
                                    </td>

                                    <td className="py-2 px-3 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            <MapPin size={9} className="text-slate-400"/> {row.location}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500">{row.qualification}</p>
                                    </td>

                                    <td className="py-2 px-3 bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[11px] font-black text-slate-800">{row.experience} <span className="text-[9px] font-bold text-slate-400 font-normal">Tot</span></p>
                                        <p className="text-[11px] font-black text-emerald-600">{row.relevantExp} <span className="text-[9px] font-bold text-emerald-400 font-normal">Rel</span></p>
                                    </td>

                                    <td className="py-2 px-3 text-center bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-500">{row.cCTC} / <span className="text-emerald-700 font-black">{row.eCTC}</span></p>
                                    </td>

                                    <td className="py-2 px-3 max-w-[150px] whitespace-normal bg-blue-50/10 group-hover:bg-blue-50/50 transition-colors border-r border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-600 italic leading-snug">"{row.feedback}"</p>
                                    </td>

                                    {/* TL SECTION CELLS */}
                                    <td className="py-2 px-3 w-52 whitespace-normal bg-amber-50/30 group-hover:bg-amber-50/60 transition-colors">
                                        {row.cvUpdateStatus ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(row.cvUpdateStatus)}`}>
                                                        {row.cvUpdateStatus}
                                                    </span>
                                                    {/* TL CV View Button */}
                                                    {row.redacted_cv_url && (
                                                        <button 
                                                            onClick={() => openCVModal(row, 'tl')}
                                                            className="flex items-center gap-1 text-[8px] font-black bg-white border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors"
                                                            title="View TL Updated CV"
                                                        >
                                                            <FileCheck size={9}/> View TL CV
                                                        </button>
                                                    )}
                                                </div>
                                                {row.tlReview && <p className="text-[9px] font-medium text-slate-700 italic border-l-2 border-amber-300 pl-1.5 leading-tight">"{row.tlReview}"</p>}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><AlertCircle size={10}/> Pending Eval</span>
                                        )}
                                    </td>

                                    {/* Actions (Sticky Right) */}
                                    <td className="py-2 px-3 sticky right-0 bg-slate-50 group-hover:bg-amber-50/60 transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-32">
                                        
                                        {row.isSentToCRM ? (
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-full shadow-sm">
                                                    <CheckCircle2 size={12}/> Sent to CRM
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                {/* Evaluate / Edit TL Modal */}
                                                <button 
                                                    onClick={() => openTLUpdateModal(row)}
                                                    className={`w-full py-1.5 px-2 rounded flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm border ${
                                                        row.cvUpdateStatus 
                                                        ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                                        : 'bg-[#103c7f] text-white border-[#103c7f] hover:bg-blue-900'
                                                    }`}
                                                >
                                                    <Edit size={10}/> {row.cvUpdateStatus ? 'Edit Eval' : 'Evaluate'}
                                                </button>

                                                {/* Send to CRM */}
                                                {row.cvUpdateStatus && (
                                                    row.sentToCrm ? (
<div className="w-full py-1.5 px-2 rounded bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest">
    <CheckCircle2 size={10}/> SENT TO {row.sentToCrmName}
</div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleSendToCRM(row)}
                                                            className="w-full py-1.5 px-2 rounded bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                        >
                                                            <Send size={10}/> To CRM
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}

                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

          
           {/* ========================================================= */}
            {/* TL EVALUATION & CV UPDATE MODAL */}
            {/* ========================================================= */}
            {modalType === 'tl_update' && selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-4 border-white">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={18}/> TL Evaluation
                                </h2>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">
                                    {selectedCandidate.name} • {selectedCandidate.profile}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body - Single Column */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                            <div className="space-y-5">
                                
                                {/* TL Status */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">CV Update<span className="text-rose-500">*</span></label>
                                    <select 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#103c7f] shadow-sm cursor-pointer"
                                        value={tlForm.cvUpdateStatus} 
                                        onChange={(e) => setTlForm({...tlForm, cvUpdateStatus: e.target.value})}
                                    >
                                        <option value="">-- Select Status --</option>
                                        <option value="JD Match">JD Match</option>
                                        <option value="Average Match">Average Match</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Call Responding */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Call Responding</label>
                                    <select 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#103c7f] shadow-sm cursor-pointer"
                                        value={tlForm.callResponding} 
                                        onChange={(e) => setTlForm({...tlForm, callResponding: e.target.value})}
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>

                                {/* Auto-Update CV Button */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Auto-Format CV (Remove Contact Info)</label>
                                    
                                    {!tlForm.updatedCvName && !previewData ? (
                                        <button 
                                            onClick={handleAutoUpdateCV}
                                            disabled={isUpdatingCV}
                                            className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl p-5 flex flex-col items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            {isUpdatingCV ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin mb-2" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Processing PDF...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileCheck size={24} className="mb-2" />
                                                    <span className="text-sm font-black uppercase tracking-widest">Auto-Update CV</span>
                                                    <span className="text-[10px] font-bold text-indigo-500 mt-1">Removes Email & Phone Number</span>
                                                </>
                                            )}
                                        </button>
                                    ) : previewData ? (
                                        <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertCircle size={18} className="text-amber-600" />
                                                <span className="text-xs font-black text-amber-800 uppercase tracking-widest">PII Detected - Confirm Redaction</span>
                                            </div>
                                            
                                            {previewData.emails_found?.length > 0 && (
                                                <div className="mb-2">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Emails Found:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {previewData.emails_found.map((email, idx) => (
                                                            <span key={idx} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-medium">{email}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {previewData.phones_found?.length > 0 && (
                                                <div className="mb-3">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Phones Found:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {previewData.phones_found.map((phone, idx) => (
                                                            <span key={idx} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-medium">{phone}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    onClick={handleCancelPreview}
                                                    disabled={isUpdatingCV}
                                                    className="flex-1 border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleConfirmRedaction}
                                                    disabled={isUpdatingCV}
                                                    className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {isUpdatingCV ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                    Confirm Redact
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-black text-slate-800 truncate max-w-[130px]" title={tlForm.updatedCvName}>{tlForm.updatedCvName}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Contact Info Removed</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => openCVModal(selectedCandidate, 'tl')}
                                                className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                                            >
                                                <Eye size={14}/> View CV
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* TL Review */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <MessageSquare size={12} className="text-[#103c7f]"/> TL Review / Remarks
                                    </label>
                                    <textarea 
                                        rows="4" 
                                        placeholder="Reason for selection/rejection, changes made in CV..." 
                                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#103c7f] resize-none shadow-sm"
                                        value={tlForm.tlReview} 
                                        onChange={(e) => setTlForm({...tlForm, tlReview: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                            <button onClick={() => setModalType(null)} className="bg-slate-50 border border-slate-200 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveTLUpdate} disabled={isSaving} className="bg-[#103c7f] hover:bg-blue-900 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 min-w-[140px]">
                                {isSaving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={14}/> Save Evaluation
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
          {/* --- VIEW CV MODAL (Overlay above other modals) --- */}
            {cvViewer.isOpen && selectedCandidate && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border-4 border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className={`text-white p-4 flex justify-between items-center shrink-0 ${cvViewer.source === 'rc' ? 'bg-blue-800' : 'bg-amber-600'}`}>
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText size={18}/> 
                                {cvViewer.source === 'rc' ? "Recruiter's Original CV" : "TL's Redacted CV"} : {selectedCandidate.name}
                            </h2>
                            
                            {/* UPDATED CLOSE BUTTON HERE */}
                            <button 
                                onClick={() => setCvViewer({isOpen: false, source: null})} 
                                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors shadow-sm"
                                title="Close Modal"
                            >
                                <X size={20} />
                            </button>
                            
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-8">
                            <CVPreview 
                                url={cvViewer.source === 'rc' ? selectedCandidate.cv_url : (tlForm.updatedCvName || selectedCandidate.redacted_cv_url)} 
                                name={selectedCandidate.name} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- SEND TO CRM MODAL --- */}
            {crmModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-4 border-white">
                        
                        {/* Header */}
                        <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <Send size={18}/> Send to CRM
                                </h2>
                                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-1">
                                    {selectedCandidate?.name} • {selectedCandidate?.profile}
                                </p>
                            </div>
                            <button onClick={() => setCrmModalOpen(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 bg-slate-50/50">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                Select CRM User <span className="text-rose-500">*</span>
                            </label>
                            
                            {isLoadingCrmUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-slate-400" />
                                    <span className="ml-2 text-sm font-bold text-slate-500">Loading CRM users...</span>
                                </div>
                            ) : crmUsers.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <User size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-bold">No CRM users found</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                    {crmUsers.map((user) => (
                                        <button
                                            key={user.user_id}
                                            onClick={() => setSelectedCrmUser(user)}
                                            className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                                                selectedCrmUser?.user_id === user.user_id
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                selectedCrmUser?.user_id === user.user_id
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <User size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-slate-800">{user.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                                            </div>
                                            {selectedCrmUser?.user_id === user.user_id && (
                                                <CheckCircle2 size={18} className="ml-auto text-emerald-500 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                            <button onClick={() => setCrmModalOpen(false)} className="bg-slate-50 border border-slate-200 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmSendToCRM}
                                disabled={!selectedCrmUser}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle2 size={14}/> Confirm Send
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}