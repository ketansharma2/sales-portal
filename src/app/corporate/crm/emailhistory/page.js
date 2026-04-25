"use client";
import { useState, useMemo ,useEffect} from "react";
import { 
    Building2, History, Calendar, X, FileText, Upload,
    MapPin, GraduationCap, Eye, Mail, CheckCircle2, 
    Clock, Users, UserCheck, AlertCircle, Briefcase, XCircle, Loader2, File, Send, User, Phone, IndianRupee, FileText as FileTextIcon
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
        const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
        return (
            <iframe
                src={googleDocsUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`Word Document Preview: ${name}`}
                onError={() => setError('Failed to load preview. The file may not be publicly accessible.')}
            />
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
     const [revenueTeamUsers, setRevenueTeamUsers] = useState([]);
     
     // PDF Preview State
     const [cvViewer, setCvViewer] = useState({ isOpen: false });
     
     // Revenue Modal State
     const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
     const [isSubmittingRevenue, setIsSubmittingRevenue] = useState(false);
      const [revenueForm, setRevenueForm] = useState({
          // Internal Team Data
          joiningDate: '',
          paymentFrom: '',
          tlName: '',
          rcName: '',
          offerSalary: '',
          terms: '',
          paymentDays: '',
          kycDoc: '',
          revenueTeamId: '',
          revenueTeamName: '',
          // Client/Candidate Details
          clientId: '',
          clientName: '',
          clientEmail: '',
          clientMobile: '',
          candidateName: '',
          candidateEmail: '',
          candidateMobile: '',
          parsingId: ''
      });
    
     // --- FETCH CLIENTS FOR DROPDOWN ---
     useEffect(() => {
         const fetchClients = async () => {
             try {
                 const session = JSON.parse(localStorage.getItem('session') || '{}');
                 const token = session.access_token;
                 
                 const response = await fetch('/api/corporate/crm/clients', {
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
     
     // --- FETCH REVENUE TEAM USERS FOR DROPDOWN ---
     useEffect(() => {
         const fetchRevenueTeamUsers = async () => {
             try {
                 const session = JSON.parse(localStorage.getItem('session') || '{}');
                 const token = session.access_token;
                 
                 const response = await fetch('/api/corporate/crm/revenue-team', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 
                 const result = await response.json();
                 
                 if (result.success && result.data) {
                     setRevenueTeamUsers(result.data);
                 }
             } catch (error) {
                 console.error('Error fetching revenue team users:', error);
             }
         };
         
         fetchRevenueTeamUsers();
     }, []);
    
    // --- FETCH EMAIL HISTORY DATA ---
    useEffect(() => {
        const fetchEmailHistory = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/corporate/crm/email-history', {
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
                           email_draft_id: row.id,
                           client_id: row.client_id || '',
                           // New fields from enhanced API
                           candidate_email: row.candidate_email || '',
                           candidate_mobile: row.candidate_mobile || '',
                           rc_id: row.rc_id || '',
                           tl_id: row.tl_id || '',
                           rc_name: row.rc_name || '',
                           tl_name: row.tl_name || '',
                           client_email: row.client_email || '',
                           client_phone: row.client_phone || '',
                           kyc_doc: row.kyc_doc || '',
                           parsing_id: row.parsing_id || ''
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
            
            const response = await fetch(`/api/corporate/crm/interview-journey?email_draft_id=${candidateRow.email_draft_id}`, {
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
       const sendToRevenueTeam = (row) => {
           // Pre-fill the form with available data from row
           setRevenueForm({
               // Internal Team Data (now available from row)
               joiningDate: '',
               paymentFrom: '',
               tlName: row.tl_name || '',
               rcName: row.rc_name || '',
               offerSalary: '',
               terms: '',
               paymentDays: '',
               kycDoc: row.kyc_doc || '',
               revenueTeamId: '',
               revenueTeamName: '',
               // Client/Candidate Details (available from row)
               clientId: row.client_id || '',
               clientName: row.clientCompany || '',
               clientEmail: row.client_email || '',
               clientMobile: row.client_phone || '',
               candidateName: row.name || '',
               candidateEmail: row.candidate_email || '',
               candidateMobile: row.candidate_mobile || '',
               parsingId: row.parsing_id || ''
           });
           setSelectedCandidate(row);
           setIsRevenueModalOpen(true);
       };

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
                                        <td className="py-3 px-4 sticky right-0 bg-white transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-40">
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={() => openViewJourneyModal(row)}
                                                    className="w-full py-2 px-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                >
                                                    <Eye size={12}/> View Journey
                                                </button>
                                                <button 
                                                    onClick={() => sendToRevenueTeam(row)}
                                                    className="w-full py-2 px-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                >
                                                    <Send size={12}/> Send to Revenue
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border-2 border-indigo-500/20 animate-in zoom-in-95">
                         
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-indigo-500/30">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16}/> Interview Journey
                                </h2>
                                <p className="text-[10px] text-indigo-100 font-bold mt-1 uppercase tracking-widest">
                                    {selectedCandidate.name} • {selectedCandidate.clientCompany}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                        </div>

                        {/* Modal Body (Scrollable Timeline) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                {selectedCandidate.journey && selectedCandidate.journey.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedCandidate.journey.map((step) => (
                                            <div key={step.id} className="relative pl-6 border-l-2 border-indigo-200 pb-4 last:border-l-0 last:pb-0">
                                                <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                                                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm -mt-1 hover:border-indigo-300 hover:shadow-md transition-all">
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
                                    <div className="text-center flex flex-col items-center justify-center py-8">
                                        <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No updates yet.</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-1">Journey tracking will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                         
                        {/* Current Status Footer */}
                        <div className="bg-slate-50 border-t border-slate-200 p-3 text-center shrink-0 flex items-center justify-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Status:</span>
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(selectedCandidate.currentStatus)}`}>
                                {selectedCandidate.currentStatus}
                            </span>
                        </div>

                    </div>
                </div>
            )}

            {/* --- VIEW CV MODAL --- */}
            {cvViewer.isOpen && selectedCandidate && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh] border-[3px] border-indigo-700">
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white p-5 flex justify-between items-center shrink-0 border-b border-indigo-500/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <FileText size={20}/>
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest">CV Preview</h2>
                                    <p className="text-[10px] text-indigo-200 font-bold mt-0.5">{selectedCandidate.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setCvViewer({isOpen: false})} className="hover:bg-white/20 p-2 rounded-lg transition-colors group">
                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 overflow-hidden">
                            <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
                                <CVPreview 
                                    url={selectedCandidate.cv_url}
                                    name={selectedCandidate.name}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* --- SEND TO REVENUE MODAL --- */}
             {isRevenueModalOpen && selectedCandidate && (
                 <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                     <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-[3px] border-emerald-500/30">
                         
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-900 to-emerald-400 text-white px-6 py-4 flex justify-between items-center text-white shrink-0 border-b border-emerald-500/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Send size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest">Send to Revenue Team</h2>
                                    <p className="text-[10px] text-emerald-100 font-bold mt-0.5">{selectedCandidate.name} • {selectedCandidate.clientCompany}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRevenueModalOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors group">
                                <X size={18} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-6">
                                 
                                 {/* SECTION 1: INTERNAL TEAM DATA */}
                                 <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border-2 border-emerald-100 relative">
                                     <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                                         <Users size={14} className="text-emerald-500"/> Internal Team Data
                                     </h4>
                                     
                                      {/* Top-right badges */}
                                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                          <span className="text-[9px] font-black text-slate-400 uppercase">RC:</span>
                                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${revenueForm.rcName ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                              {revenueForm.rcName || 'RC'}
                                          </span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase">TL:</span>
                                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${revenueForm.tlName ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                              {revenueForm.tlName || 'TL'}
                                          </span>
                                      </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                         {/* Offer Salary */}
                                         <div>
                                             <div className="flex items-center justify-between mb-1.5">
                                                 <label className="text-[10px] font-black text-emerald-600 uppercase">Offer Salary (Annual LPA)</label>
                                                 {revenueForm.offerSalary !== '' && revenueForm.offerSalary !== null && revenueForm.offerSalary !== undefined ? (
                                                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                         {parseFloat(revenueForm.offerSalary).toLocaleString('en-IN')}
                                                     </span>
                                                 ) : null}
                                             </div>
                                             <div className="relative">
                                                 <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"/>
                                                 <input 
                                                     type="number" 
                                                     step="0.1"
                                                     className="w-full border border-emerald-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white/70"
                                                     value={revenueForm.offerSalary}
                                                     onChange={(e) => setRevenueForm({...revenueForm, offerSalary: e.target.value})}
                                                     placeholder="e.g. 12.5"
                                                 />
                                             </div>
                                         </div>

                                           {/* Terms */}
                                           <div>
                                               <div className="flex items-center justify-between mb-1.5">
                                                   <label className="text-[10px] font-black text-emerald-600 uppercase">Terms (Annual)</label>
                                                   {revenueForm.terms !== '' && revenueForm.terms !== null && revenueForm.terms !== undefined ? (
                                                       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                           {revenueForm.terms}
                                                       </span>
                                                   ) : null}
                                               </div>
                                               <div className="relative">
                                                   <FileTextIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"/>
                                                   <input 
                                                       type="number" 
                                                       className="w-full border border-emerald-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white/70"
                                                       value={revenueForm.terms}
                                                       onChange={(e) => setRevenueForm({...revenueForm, terms: e.target.value})}
                                                       placeholder="e.g. 12"
                                                   />
                                               </div>
                                           </div>

                                         {/* Payment Days */}
                                         <div>
                                             <div className="flex items-center justify-between mb-1.5">
                                                 <label className="text-[10px] font-black text-emerald-600 uppercase">Payment Days</label>
                                                 {revenueForm.paymentDays !== '' && revenueForm.paymentDays !== null && revenueForm.paymentDays !== undefined ? (
                                                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                         {revenueForm.paymentDays}
                                                     </span>
                                                 ) : null}
                                             </div>
                                             <div className="relative">
                                                 <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"/>
                                                 <input 
                                                     type="number" 
                                                     className="w-full border border-emerald-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white/70"
                                                     value={revenueForm.paymentDays}
                                                     onChange={(e) => setRevenueForm({...revenueForm, paymentDays: e.target.value})}
                                                     placeholder="e.g. 30"
                                                 />
                                             </div>
                                         </div>

                                          {/* KYC Doc */}
                                          <div>
                                              <label className="text-[10px] font-black text-emerald-600 uppercase block mb-1.5">KYC Doc</label>
                                              <div className="flex flex-col items-start gap-3">
                                                  {revenueForm.kycDoc ? (
                                                      <>
                                                          <div className="flex items-center gap-2">
                                                              <a 
                                                                  href={revenueForm.kycDoc}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                                              >
                                                                  Doc
                                                              </a>
                                                          </div>
                                                          <button 
                                                              onClick={() => {
                                                               // Trigger file input click
                                                              document.getElementById('kyc-file-input')?.click();
                                                              }}
                                                              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                                                          >
                                                              <Upload size={16} className="mr-1"/> 
                                                              Add KYC Document
                                                          </button>
                                                      </>
                                                  ) : (
                                                      <>
                                                          <div className="w-full text-center text-sm font-bold text-emerald-600">
                                                              No existing Doc found for this client
                                                          </div>
                                                          <button 
                                                              onClick={() => {
                                                               // Trigger file input click
                                                              document.getElementById('kyc-file-input')?.click();
                                                              }}
                                                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                                                          >
                                                              <Upload size={16} className="mr-1"/> 
                                                              Add KYC Document
                                                          </button>
                                                      </>
                                                  )}
                                                  <input 
                                                      type="file" 
                                                      id="kyc-file-input"
                                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                          if (e.target.files && e.target.files[0]) {
                                                              const file = e.target.files[0];
                                                              // In a real app, you would upload the file to storage and get a URL
                                                              // For now, we'll simulate with a placeholder
                                                              const fileURL = URL.createObjectURL(file);
                                                              setRevenueForm({...revenueForm, kycDoc: file.name});
                                                              // Clean up object URL
                                                              setTimeout(() => URL.revokeObjectURL(fileURL), 100);
                                                          }
                                                      }}
                                                  />
                                              </div>
                                          </div>

                                    </div>
                                </div>

                                {/* SECTION 2: CLIENT/CANDIDATE DETAILS */}
                                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border-2 border-indigo-100">
                                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                                        <Building2 size={14} className="text-indigo-500"/> Client / Candidate Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        
                                        {/* Client Name */}
                                        <div>
                                            <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Client Name</label>
                                            <div className="relative">
                                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                <input 
                                                    type="text" 
                                                    className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                    value={revenueForm.clientName}
                                                    onChange={(e) => setRevenueForm({...revenueForm, clientName: e.target.value})}
                                                    placeholder="Client company name"
                                                />
                                            </div>
                                        </div>

                                        {/* Client Email */}
                                        <div>
                                            <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Client Email</label>
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                <input 
                                                    type="email" 
                                                    className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                    value={revenueForm.clientEmail}
                                                    onChange={(e) => setRevenueForm({...revenueForm, clientEmail: e.target.value})}
                                                    placeholder="client@company.com"
                                                />
                                            </div>
                                        </div>

                                         {/* Client Phone */}
                                         <div>
                                             <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Client Mobile</label>
                                             <div className="relative">
                                                 <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                 <input 
                                                     type="tel" 
                                                     className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                     value={revenueForm.clientMobile}
                                                     onChange={(e) => setRevenueForm({...revenueForm, clientMobile: e.target.value})}
                                                     placeholder="+91 XXXXX XXXXX"
                                                 />
                                             </div>
                                         </div>

                                        {/* Candidate Name */}
                                        <div>
                                            <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Candidate Name</label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                <input 
                                                    type="text" 
                                                    className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                    value={revenueForm.candidateName}
                                                    onChange={(e) => setRevenueForm({...revenueForm, candidateName: e.target.value})}
                                                    placeholder="Candidate full name"
                                                />
                                            </div>
                                        </div>

                                        {/* Candidate Email */}
                                        <div>
                                            <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Candidate Email</label>
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                <input 
                                                    type="email" 
                                                    className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                    value={revenueForm.candidateEmail}
                                                    onChange={(e) => setRevenueForm({...revenueForm, candidateEmail: e.target.value})}
                                                    placeholder="candidate@email.com"
                                                />
                                            </div>
                                        </div>

                                         {/* Candidate Phone */}
                                         <div>
                                             <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1.5">Candidate Mobile</label>
                                             <div className="relative">
                                                 <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
                                                 <input 
                                                     type="tel" 
                                                     className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white/70"
                                                     value={revenueForm.candidateMobile}
                                                     onChange={(e) => setRevenueForm({...revenueForm, candidateMobile: e.target.value})}
                                                     placeholder="+91 XXXXX XXXXX"
                                                 />
                                             </div>
                                         </div>

                                    </div>
                                     </div>
                                 </div>

                              {/* NEW SECTION: SEND TO REVENUE TEAM WITH DROPDOWN */}
                              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border-2 border-emerald-100 mt-4">
                                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                                      <Send size={14}/> Send to Revenue Team
                                  </h4>
                                  <div className="space-y-3">
                                      <div>
                                          <label className="text-[10px] font-black text-emerald-600 uppercase block mb-1.5">Revenue Team Member</label>
                                          <div className="relative">
                                              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"/>
                                              <select 
                                                  className="w-full border border-emerald-200 rounded-lg p-2.5 pl-9 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white/70"
                                                  value={revenueForm.revenueTeamId} 
                                                  onChange={(e) => {
                                                      const selectedUser = revenueTeamUsers.find(user => user.user_id === e.target.value);
                                                      setRevenueForm({
                                                          ...revenueForm,
                                                          revenueTeamId: e.target.value,
                                                          revenueTeamName: selectedUser ? selectedUser.name : ''
                                                      });
                                                  }}
                                              >
                                                  <option value="">Select Revenue Team Member</option>
                                                  {revenueTeamUsers.map(user => (
                                                      <option key={user.user_id} value={user.user_id}>
                                                          {user.name}
                                                      </option>
                                                  ))}
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                             <div className="flex justify-end gap-3 mt-2">
                                 <button 
                                     onClick={() => setIsRevenueModalOpen(false)}
                                     className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                                 >
                                     Cancel
                                 </button>
                                  <button 
                                      onClick={async () => {
                                          if (!revenueForm.revenueTeamId) {
                                              alert('Please select a revenue team member');
                                              return;
                                          }
                                          if (!revenueForm.offerSalary || !revenueForm.terms || !revenueForm.paymentDays) {
                                              alert('Please fill in all required fields: Offer Salary, Terms, and Payment Days');
                                              return;
                                          }

                                          setIsSubmittingRevenue(true);
                                          try {
                                              const session = JSON.parse(localStorage.getItem('session') || '{}');
                                              const token = session.access_token;

                                              const response = await fetch('/api/corporate/crm/revenue', {
                                                  method: 'POST',
                                                  headers: {
                                                      'Authorization': `Bearer ${token}`,
                                                      'Content-Type': 'application/json'
                                                  },
                                                  body: JSON.stringify({
                                                      // User who sent to revenue
                                                      user_id: session.user_id || session.id,
                                                      // Client info
                                                      client_id: revenueForm.clientId,
                                                      client_name: revenueForm.clientName,
                                                      client_email: revenueForm.clientEmail,
                                                      client_mobile: revenueForm.clientMobile,
                                                      // Candidate info
                                                      candidate_name: revenueForm.candidateName,
                                                      candidate_email: revenueForm.candidateEmail,
                                                      candidate_mobile: revenueForm.candidateMobile,
                                                      // Financials
                                                      offer_salary: revenueForm.offerSalary,
                                                      terms: revenueForm.terms,
                                                      payment_days: parseInt(revenueForm.paymentDays),
                                                      // KYC doc
                                                      kyc_doc: revenueForm.kycDoc,
                                                      // Parsing and assignment
                                                      parsing_id: revenueForm.parsingId,
                                                      sent_to_revenue: revenueForm.revenueTeamId
                                                  })
                                              });

                                              const result = await response.json();

                                              if (response.ok && result.success) {
                                                  alert('Successfully sent to Revenue Team!');
                                                  setIsRevenueModalOpen(false);
                                                  setRevenueForm({
                                                      clientId: '',
                                                      clientName: '',
                                                      clientEmail: '',
                                                      clientMobile: '',
                                                      candidateName: '',
                                                      candidateEmail: '',
                                                      candidateMobile: '',
                                                      tlName: '',
                                                      rcName: '',
                                                      offerSalary: '',
                                                      terms: '',
                                                      paymentDays: '',
                                                      kycDoc: '',
                                                      paymentFrom: '',
                                                      revenueTeamId: '',
                                                      revenueTeamName: '',
                                                      parsingId: ''
                                                  });
                                              } else {
                                                  alert(result.error || 'Failed to send to revenue team');
                                              }
                                          } catch (error) {
                                              console.error('Error sending to revenue:', error);
                                              alert('Error sending to revenue team');
                                          } finally {
                                              setIsSubmittingRevenue(false);
                                          }
                                      }}
                                      disabled={isSubmittingRevenue}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                     {isSubmittingRevenue ? (
                                         <>
                                             <Loader2 size={14} className="animate-spin" />
                                             Submitting...
                                         </>
                                     ) : (
                                         <>
                                             <Send size={14}/> Submit to Revenue
                                         </>
                                     )}
                                 </button>
                             </div>
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