"use client";
import { useState, useMemo ,useEffect} from "react";
import { 
    Building2, History, Calendar, X, FileText, 
    MapPin, GraduationCap, Eye, Mail, CheckCircle2, 
    Clock, Users, UserCheck, AlertCircle, Briefcase, XCircle, Loader2, File
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
                
                // Detect actual file type from magic bytes if binary/octet-stream
                let detectedType = blob.type;
                if (blob.type === 'binary/octet-stream' || blob.type === 'application/octet-stream') {
                    const arrayBuffer = await blob.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
                    const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    if (header.startsWith('25504446')) {
                        detectedType = 'application/pdf';
                    } else if (header.startsWith('89504e47')) {
                        detectedType = 'image/png';
                    } else if (header.startsWith('ffd8ff')) {
                        detectedType = 'image/jpeg';
                    } else if (header.startsWith('504b')) {
                        detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }
                }
                setFileType(detectedType);
                
                // For images, convert to PDF first
                if (detectedType.startsWith('image/')) {
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
                } else if (detectedType === 'application/pdf') {
                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                    const fileBlobUrl = URL.createObjectURL(pdfBlob);
                    setBlobUrl(fileBlobUrl);
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

export default function EmailHistoryPage() {
    // --- STATE ---
    const [selectedClient, setSelectedClient] = useState("All");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [modalType, setModalType] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [emailData, setEmailData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientsList, setClientsList] = useState([]);
    
    // PDF Preview State
    const [cvViewer, setCvViewer] = useState({ isOpen: false });
    
    // --- FETCH CLIENTS FOR DROPDOWN ---
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/domestic/crm/clients', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setClientsList(result.data);
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };
        
        fetchClients();
    }, []);
    
    // --- FETCH EMAIL HISTORY DATA ---
    useEffect(() => {
        const fetchEmailHistory = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/domestic/crm/email-history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    const transformedData = result.data.map(row => ({
                        id: row.id,
                        dateShared: row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
                        shared_date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null,
                        clientCompany: row.company_name || '-',
                        sentVia: row.sent_via || '-',
                        name: row.name || '-',
                        profile: row.profile || '-',
                        location: row.location || '-',
                        qualification: row.qualification || '-',
                        experience: row.experience || '-',
                        tlCvName: row.cv_url ? row.cv_url.split('/').pop() : '-',
                        currentStatus: row.latest_interview_status || '-', 
                        crmFeedback: row.feedback || '-',
                        cv_url: row.cv_url || '',
                        email_draft_id: row.id
                    }));
                    setEmailData(transformedData);
                }
            } catch (error) {
                console.error('Error fetching email history:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEmailHistory();
    }, []);
    
    // --- FETCH JOURNEY FOR VIEW MODAL ---
    const openViewJourneyModal = async (candidateRow) => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const token = session.access_token;
            
            const response = await fetch(`/api/domestic/crm/interview-journey?email_draft_id=${candidateRow.email_draft_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            const journeyData = result.success && result.data 
                ? result.data.map(item => ({
                    id: item.id,
                    status: item.interview_status,
                    date: item.date,
                    remark: item.client_remark
                  }))
                : [];
            
            setSelectedCandidate({ ...candidateRow, journey: journeyData });
            setModalType('view_journey');
        } catch (error) {
            console.error('Error fetching journey:', error);
        }
    };
    
    // --- FETCH PDF PREVIEW ---
    const fetchPdfPreview = (candidate) => {
        setSelectedCandidate(candidate);
        setCvViewer({ isOpen: true });
    };

    // --- EXTRACT UNIQUE COMPANIES FOR FILTER ---
    // Use clientsList for dropdown, but still use emailData for filtering when "All" is not selected
    const clientCompanies = [...new Set(emailData.map(item => item.clientCompany))];

    // --- FILTER DATA BASED ON DROPDOWN AND DATE RANGE ---
    const filteredData = useMemo(() => {
        let data = emailData;
        
        // Filter by client
        if (selectedClient !== "All") {
            data = data.filter(row => row.clientCompany === selectedClient);
        }
        
        // Filter by date range
        if (dateRange.start && dateRange.end) {
            data = data.filter(row => {
                if (!row.shared_date) return false;
                const rowDate = new Date(row.shared_date);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                return rowDate >= startDate && rowDate <= endDate;
            });
        }
        
        return data;
    }, [selectedClient, dateRange, emailData]);

    // --- CALCULATE DYNAMIC KPIs ---
    const kpiCounts = useMemo(() => {
        return {
            shared: filteredData.length, // Total rows in the filtered list
            shortlisted: filteredData.filter(d => d.currentStatus === 'Shortlisted').length,
            selected: filteredData.filter(d => d.currentStatus === 'Selected').length,
            interviewed: filteredData.filter(d => d.currentStatus === 'Interviewed').length,       
            joining: filteredData.filter(d => d.currentStatus === 'Joining').length,
            pipeline: filteredData.filter(d => d.currentStatus === 'Pipeline').length,
            ghosted: filteredData.filter(d => d.currentStatus === 'Ghosted').length,
            rejected: filteredData.filter(d => d.currentStatus === 'Rejected').length, // New KPI added here
        };
    }, [filteredData]);

    // --- HANDLERS ---
    const getStatusBadge = (status) => {
        if (status === 'Shortlisted') return 'bg-blue-50 text-blue-600 border-blue-200';
        if (status === 'Selected') return 'bg-green-50 text-green-600 border-green-200';
        if (status === 'Interviewed') return 'bg-amber-50 text-amber-600 border-amber-200';
        if (status === 'Joining') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (status === 'Pipeline') return 'bg-purple-50 text-purple-600 border-purple-200';
        if (status === 'Ghosted') return 'bg-rose-50 text-rose-600 border-rose-200';
        if (status === 'Rejected') return 'bg-red-50 text-red-600 border-red-200';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={18} />
                    </div>
                    Client Email History
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 xl:ml-10">
                    Track CV Submissions & Candidate Interview Journeys
                </p>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full max-w-md">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                        <Building2 size={14} className="inline mr-1 mb-0.5 text-indigo-500"/> Select Client:
                    </label>
                    <select 
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                        value={selectedClient} 
                        onChange={(e) => setSelectedClient(e.target.value)}
                    >
                        <option value="All">All Clients (Overall View)</option>
                        <optgroup label="Specific Companies">
                            {clientsList.map(c => <option key={c.client_id} value={c.company_name}>{c.company_name}</option>)}
                        </optgroup>
                    </select>
                </div>
                <div className="flex items-center gap-2 w-full max-w-sm">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                        <Calendar size={14} className="inline mr-1 mb-0.5 text-indigo-500"/> Date Range:
                    </label>
                    <input 
                        type="date" 
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-xs font-bold text-slate-400">to</span>
                    <input 
                        type="date" 
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
            </div>

            {/* --- DYNAMIC KPI CARDS --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
                <KpiCard title="Tracker Shared" count={kpiCounts.shared} icon={<Mail size={16}/>} color="indigo" />
                <KpiCard title="Shortlisted" count={kpiCounts.shortlisted} icon={<UserCheck size={16}/>} color="blue" />
                <KpiCard title="Selected" count={kpiCounts.selected} icon={<CheckCircle2 size={16}/>} color="green" />
                <KpiCard title="Interviewed" count={kpiCounts.interviewed} icon={<Users size={16}/>} color="amber" />
                <KpiCard title="Joining" count={kpiCounts.joining} icon={<CheckCircle2 size={16}/>} color="emerald" />
                <KpiCard title="Pipeline" count={kpiCounts.pipeline} icon={<Clock size={16}/>} color="purple" />
                <KpiCard title="Ghosted / No Reply" count={kpiCounts.ghosted} icon={<AlertCircle size={16}/>} color="rose" />
                <KpiCard title="Rejected" count={kpiCounts.rejected} icon={<XCircle size={16}/>} color="red" />
            </div>

            {/* --- MAIN EMAIL HISTORY TABLE --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto custom-scrollbar min-h-[50vh] pb-4">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1300px]">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900 text-white">
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Client Company</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Candidate</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Profile & Location</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Experience</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest max-w-[200px] border-b border-slate-700">Initial Email Feedback</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-700">CV File</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-700">Current Status</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest bg-indigo-900/50 sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)] text-center border-l border-b border-slate-700 w-32">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        
                                        {/* Company & Date */}
                                        <td className="py-3 px-4 border-r border-slate-50 bg-slate-50/30">
                                            <p className="text-xs font-black text-indigo-700">{row.clientCompany}</p>
                                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                                                <Calendar size={10} className="text-indigo-400"/> Shared: {row.dateShared} via {row.sentVia}
                                            </p>
                                        </td>

                                        {/* Candidate Details */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-black text-slate-800">{row.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                                                <GraduationCap size={10} className="text-slate-400"/> {row.qualification}
                                            </p>
                                        </td>

                                        {/* Profile & Location */}
                                        <td className="py-3 px-4">
                                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest block w-max mb-1.5">
                                                {row.profile}
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                                <MapPin size={10} className="text-slate-400"/> {row.location}
                                            </p>
                                        </td>

                                        {/* Experience */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-black text-slate-800">{row.experience}</p>
                                        </td>

                                        {/* CRM Feedback (Email Note) */}
                                        <td className="py-3 px-4 max-w-[200px] whitespace-normal">
                                            <p className="text-[10px] font-medium text-slate-600 italic leading-snug border-l-2 border-indigo-300 pl-2">
                                                "{row.crmFeedback}"
                                            </p>
                                        </td>

                                        {/* CV Link */}
                                        <td className="py-3 px-4 text-center">
                                            {row.cv_url ? (
                                                <button 
                                                    onClick={() => fetchPdfPreview(row)}
                                                    className="flex flex-col items-center justify-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    title="Preview CV"
                                                >
                                                    <FileText size={16} className="text-red-500"/>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Preview</span>
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Current Status Badge */}
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border inline-block ${getStatusBadge(row.currentStatus)}`}>
                                                {row.currentStatus}
                                            </span>
                                        </td>

                                        {/* Action Button (Sticky Right) */}
                                        <td className="py-3 px-4 sticky right-0 bg-white transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-32">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => openViewJourneyModal(row)}
                                                    className="w-full py-2 px-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                >
                                                    <Eye size={12}/> View Journey
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center">
                                        <History size={32} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No email history found for the selected client.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL: VIEW JOURNEY TIMELINE */}
            {/* ========================================================= */}
            {modalType === 'view_journey' && selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[500px] overflow-hidden flex flex-col border-4 border-white animate-in zoom-in-95">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16}/> Interview Journey
                                </h2>
                                <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">
                                    {selectedCandidate.name} • {selectedCandidate.clientCompany}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-slate-300 bg-white/10 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                        </div>

                        {/* Modal Body (Scrollable Timeline) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                            {selectedCandidate.journey && selectedCandidate.journey.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedCandidate.journey.map((step) => (
                                        <div key={step.id} className="relative pl-6 border-l-2 border-indigo-200 pb-2 last:border-l-0 last:pb-0">
                                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                                            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm -mt-2 hover:border-indigo-300 transition-colors">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">{step.status}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {step.date}</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-600 italic leading-snug">"{step.remark}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center flex flex-col items-center justify-center h-full">
                                    <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-500">No updates yet.</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Journey tracking will appear here.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Current Status Footer */}
                        <div className="bg-white border-t border-slate-100 p-3 text-center shrink-0 flex items-center justify-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(selectedCandidate.currentStatus)}`}>
                                {selectedCandidate.currentStatus}
                            </span>
                        </div>

                    </div>
                </div>
            )}

            {/* --- VIEW CV MODAL --- */}
            {cvViewer.isOpen && selectedCandidate && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border-4 border-slate-700">
                        <div className="bg-indigo-800 text-white p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText size={18}/> CV : {selectedCandidate.name}
                            </h2>
                            <button onClick={() => setCvViewer({isOpen: false})} className="text-white/70 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-8">
                            <CVPreview 
                                url={selectedCandidate.cv_url}
                                name={selectedCandidate.name}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- HELPER COMPONENT: KPI CARD ---
function KpiCard({ title, count, icon, color }) {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        rose: "bg-rose-50 text-rose-700 border-rose-100",
        red: "bg-red-50 text-red-700 border-red-100",
    };

    const activeColor = colorClasses[color] || colorClasses.indigo;

    return (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
            </div>
            <div className="flex items-end justify-between mt-1 pl-1">
                <h3 className="text-2xl font-black text-slate-800 leading-none">{count}</h3>
            </div>
        </div>
    );
}