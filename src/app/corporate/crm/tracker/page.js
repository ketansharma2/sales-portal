"use client";
import { useState, useEffect ,useMemo } from "react";
import { useRouter  } from "next/navigation";
import { 
    Building2, Mail, History, Calendar, CheckCircle2, 
    X, Send, FileText, Briefcase, MapPin, GraduationCap, Edit3, Loader2, File, MessageCircle
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
                    // For PDFs with wrong content-type, create blob with correct type
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

export default function CRMClientTrackerPage() {
    const router = useRouter();
    
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(true);
    const [crmData, setCrmData] = useState([]);
    const [modalType, setModalType] = useState(null); // 'draft_mail', 'view_cv', null
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    
    // Checkbox Selection State (For Bulk Mail)
    const [selectedRowIds, setSelectedRowIds] = useState([]);

    // Form states for modals
    const [shareForm, setShareForm] = useState({ company: "", clientId: "", toEmail: "", mobileNumber: "", manualPhone: "" });
    const [editableDraftData, setEditableDraftData] = useState([]); // Holds data for the editable table
    const [clientCompanies, setClientCompanies] = useState([]); // Dynamic client list

    // CV Viewer State
    const [cvViewer, setCvViewer] = useState({ isOpen: false, source: null });
    const [isSendingDraft, setIsSendingDraft] = useState(false);

    // Filter States
    const [selectedTL, setSelectedTL] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [tlUsers, setTlUsers] = useState([]);

    // Fetch TL users for dropdown
    useEffect(() => {
        const fetchTlUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/corporate/crm/tl-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                if (result.success && result.data) {
                    setTlUsers(result.data);
                }
            } catch (error) {
                console.error('Error fetching TL users:', error);
            }
        };
        
        fetchTlUsers();
    }, []);

    // Filter data based on TL and date range
    const filteredCrmData = useMemo(() => {
        return crmData.filter(row => {
            // TL Filter
            if (selectedTL && row.tlName !== selectedTL) return false;
            
            // Date Range Filter (based on trackerShareDate column - Column 1)
            if (dateRange.start || dateRange.end) {
                const rowDate = row.trackerShareDate;
                if (!rowDate || rowDate === '-') return false;
                
                // Parse date - handle formats: "04-Apr-2026" or "04 APR 2026" or "04-apr-2026"
                let dateStr = '';
                
                // Replace spaces with hyphens and handle both cases
                const normalizedDate = rowDate.replace(/\s+/g, '-').toLowerCase();
                const parts = normalizedDate.split('-');
                
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const monthStr = parts[1];
                    const year = parts[2];
                    
                    // Handle month names
                    const monthMap = {
                        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 
                        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 
                        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                    };
                    const monthNum = monthMap[monthStr];
                    
                    if (monthNum) {
                        dateStr = `${year}-${monthNum}-${day}`;
                    }
                }
                
                if (!dateStr) return false;
                
                // Compare dates (YYYY-MM-DD format)
                if (dateRange.start && dateStr < dateRange.start) return false;
                if (dateRange.end && dateStr > dateRange.end) return false;
            }
            
            return true;
        });
    }, [crmData, selectedTL, dateRange]);

    // Fetch CRM Tracker Data from API
    useEffect(() => {
        const fetchCrmTrackerData = async () => {
            setIsLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const response = await fetch('/api/corporate/crm/tracker', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    // Transform API data to UI format
                    const transformed = result.data.map((item, idx) => ({
                        id: item.conversation_id,
                        trackerShareDate: item.crm_sent_date || '-',
                        tlName: item.tl_name || '-',
                        name: item.candidate_name || '-',
                        profile: item.job_title || '-',
                        location: item.candidate_location || '-',
                        qualification: item.candidate_qualification || '-',
                        experience: item.candidate_experience !== undefined && item.candidate_experience !== null ? item.candidate_experience : '-',
                        relevantExp: item.relevant_exp !== undefined && item.relevant_exp !== null ? item.relevant_exp : '-',
                        cCTC: item.curr_ctc || '-',
                        eCTC: item.exp_ctc || '-',
                        tlCvName: item.redacted_cv_url || '',
                        rcCvName: item.cv_url || '',
                        tlEvaluation: item.cv_status ? `${item.cv_status}${item.tl_remarks ? ' - ' + item.tl_remarks : ''}` : '-',
                        crmFeedback: "",
                    }));
                    setCrmData(transformed);
                }
            } catch (error) {
                console.error('Error fetching CRM tracker data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCrmTrackerData();
    }, []);

    // Fetch client companies on page load
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
                    setClientCompanies(result.data);
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };
        
        fetchClients();
    }, []);

    // Open CV Modal
    const openCVModal = (candidate, cvType = 'tl') => {
        setSelectedCandidate(candidate);
        setCvViewer({ isOpen: true, source: cvType });
    };

    const openRcCvModal = (candidate) => openCVModal(candidate, 'rc');

    const toggleRowSelection = (id) => {
        setSelectedRowIds(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedRowIds.length === filteredCrmData.length) {
            setSelectedRowIds([]);
        } else {
            setSelectedRowIds(filteredCrmData.map(row => row.id));
        }
    };

    // Open Draft Mail Modal & Copy selected data to editable state
    const openDraftMailModal = () => {
        const selectedData = crmData.filter(c => selectedRowIds.includes(c.id));
        // Deep copy so we don't edit original table until saved
        const copiedData = JSON.parse(JSON.stringify(selectedData));
        // Ensure experience is properly handled (convert 0 to "0")
        copiedData.forEach(item => {
            if (item.experience === 0 || item.experience === '0') {
                item.experience = '0';
            }
        });
        setEditableDraftData(copiedData);
        setShareForm({ company: "", clientId: "", toEmail: "", mobileNumber: "", manualPhone: "" });
        setModalType('draft_mail');
    };

    // Handle input changes in the editable table
    const handleEditableDraftChange = (id, field, value) => {
        setEditableDraftData(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

   const handleSendDraftMail = async () => {
        if (isSendingDraft) return;
        if (!shareForm.company) return alert("Please select a target company.");
        
        // Get client_id from clientCompanies array to ensure it's valid
        console.log('clientCompanies:', clientCompanies);
        console.log('shareForm.company:', shareForm.company);
        
        const selectedClient = clientCompanies.find(c => c.company_name === shareForm.company);
        console.log('selectedClient:', selectedClient);
        
        const clientId = selectedClient?.client_id;
        console.log('clientId:', clientId);
        
        if (!clientId) return alert("Invalid client selection. Please select a valid client from the dropdown.");
        if (!shareForm.toEmail) return alert("Please provide recipient email(s).");
        if (editableDraftData.length === 0) return alert("No candidates to send.");
        
        console.log('Number of candidates:', editableDraftData.length);
        
        setIsSendingDraft(true);
        
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        
        if (!token) {
            setIsSendingDraft(false);
            return alert("Session expired. Please login again.");
        }
        
        console.log('Token exists:', !!token);
        
        try {
            // 1. Save each candidate to database (corporate_crm_emails)
            // This saves candidate data when clicking "Save Draft & Copy to Clipboard" button
            console.log('Saving data - company:', shareForm.company, 'clientId:', clientId);
            
            for (const row of editableDraftData) {
                console.log('Saving candidate:', row.name, 'id:', row.id);
                
                const saveResponse = await fetch('/api/corporate/crm/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conversation_id: row.id,
                        company_name: shareForm.company,
                        client_id: clientId,
                        name: row.name,
                        profile: row.profile,
                        location: row.location,
                        qualification: row.qualification,
                        experience: row.experience,
                        feedback: row.crmFeedback,
                        cv_url: row.tlCvName || '',
                        sent_via: 'Email'
                    })
                });
                
                console.log('Save response status:', saveResponse.status);
                const saveResult = await saveResponse.json();
                console.log('Save result:', saveResult);
                
                if (!saveResponse.ok) {
                    console.error('Save error:', saveResult);
                    alert(`Error saving candidate ${row.name}: ${saveResult.error}`);
                    setIsSendingDraft(false);
                    return;
                }
            }
            
            console.log('All candidates saved successfully!');
            
            // 2. Generate HTML Email Content
            const companyName = shareForm.company;
            const subject = `Shortlisted Candidates - ${companyName}`;
            
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const bdName = userData.name || userData.email || 'Maven Jobs Team';
            
            let candidateTableRows = "";
            editableDraftData.forEach((row, i) => {
                let rowBg = i % 2 === 0 ? '#ffffff' : '#faf9fe';
                
                candidateTableRows += `
                    <tr style="background-color: ${rowBg};">
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.name || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.profile || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.location || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.qualification || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.experience || "0"} Years</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0; line-height: 1.5; max-width: 250px;">${row.crmFeedback || ""}</td>
                        <td style="padding: 16px 15px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                            ${row.tlCvName ? `<a href="${row.tlCvName}" target="_blank" style="display: inline-block; background-color: #e6d8f5; color: #5b3b8c; padding: 8px 24px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 13px;">CV</a>` : '-'}
                        </td>
                    </tr>
                `;
            });
            
            const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3eefa; background-image: linear-gradient(to right, #f3eefa 0%, #e0f6eb 100%);">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 850px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: left;">
                            <tr>
                                <td style="padding: 40px;">
                                    
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <img src="https://mavenjobs.in/wp-content/uploads/2024/01/maven-12-1.png" alt="Maven Jobs Logo" style="height: 45px; width: auto; border: none; display: inline-block;">
                                    </div>

                                    <div style="margin-bottom: 25px;">
                                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #222;">
                                            Hi ${companyName},
                                        </p>
                                        <p style="margin: 0; font-size: 15px; color: #222;">
                                            Please find the shortlisted candidates below:
                                        </p>
                                    </div>

                                    <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; text-align: left; font-family: Arial, sans-serif;">
                                            <thead>
                                                <tr style="background-color: #e6d8f5;">
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Name</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Profile</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Location</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Qualification</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Experience</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Feedback</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px; text-align: center;">Resume</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${candidateTableRows}
                                            </tbody>
                                        </table>
                                    </div>

                                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 35px 0 25px 0;">

                                    <div style="text-align: left; margin-bottom: 15px;">
                                        <span style="font-size: 18px; color: #006400; font-weight: bold;">${bdName}</span>
                                        <span style="font-size: 16px; color: #000000; display: block; font-weight: bold;">
                                            Maven Jobs<br>Recruitment Agency<br>2nd Floor, Sec 25, Panipat
                                        </span>
                                    </div>

                                    <div style="text-align: left;">
                                        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://www.facebook.com/mavenjobspanipat/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/facebook-circle-black-bordered.png" alt="FB" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://twitter.com/Maven_Jobs" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/x-circle-black-bordered.png" alt="X" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://www.instagram.com/mavenjobs/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/instagram-circle-black-bordered.png" alt="IG" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://in.linkedin.com/company/maven-jobs" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/linkedin-circle-black-bordered.png" alt="IN" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://in.pinterest.com/Mavenjobs/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/pinterest-circle-black-bordered.png" alt="PIN" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                </td>
                            </tr>
                        </table>
                        
                    </td>
                </tr>
            </table>

            <div style="font-family: Arial, sans-serif; padding: 20px 30px; background-color: #ffffff;">
                <div style="color: #333; margin-bottom: 15px;">--</div>
                
                <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                    <tr>
                        <td valign="middle" style="padding-right: 25px; text-align: center;">
                            <img src="https://mavenjobs.in/wp-content/uploads/2024/01/maven-12-1.png" alt="Maven Jobs" width="130" style="display: block; border: none; margin: 0 auto;">
                            <div style="font-size: 11px; color: #0f3f7a; font-weight: bold; margin-top: 6px; letter-spacing: 0.5px;">Join | Connect | Grow</div>
                        </td>
                        
                        <td width="2" style="background-color: #d4d4d4;"></td>
                        
                        <td valign="middle" style="padding-left: 25px;">
                            <div style="font-size: 20px; font-weight: bold; color: #0f3f7a; margin-bottom: 4px;">${bdName}</div>
                            <div style="font-size: 15px; font-weight: bold; color: #666; margin-bottom: 2px;">Business Development Lead</div>
                            <div style="font-size: 15px; font-weight: bold; color: #666; margin-bottom: 12px;">Maven Jobs</div>

                            <table cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #333;">
                                <tr>
                                    <td style="padding-bottom: 8px; padding-right: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">📞</span> 
                                        <span style="vertical-align: middle;">+91 8307075952</span>
                                    </td>
                                    <td style="padding-bottom: 8px; border-left: 2px solid #e0e0e0; padding-left: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">📍</span> 
                                        <span style="vertical-align: middle;">( Gurgaon )</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-right: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">✉</span> 
                                        <a href="mailto:bd@mavenjobs.in" style="color: #0f3f7a; text-decoration: none; vertical-align: middle;">bd@mavenjobs.in</a>
                                    </td>
                                    <td style="border-left: 2px solid #e0e0e0; padding-left: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">🌐</span> 
                                        <a href="http://www.mavenjobs.in" style="color: #0f3f7a; text-decoration: none; vertical-align: middle;">www.mavenjobs.in</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
            
        </body>
        </html>`;

            // 3. Copy HTML to clipboard and open Gmail
            try {
                const blob = new Blob([emailBody], { type: 'text/html' });
                const textBlob = new Blob([emailBody], { type: 'text/plain' });
                
                const item = new ClipboardItem({
                    'text/html': blob,
                    'text/plain': textBlob
                });
                
                await navigator.clipboard.write([item]);
                
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&to=${encodeURIComponent(shareForm.toEmail)}`;
                window.open(gmailUrl, '_blank');
            } catch (clipError) {
                console.error('Error copying to clipboard:', clipError);
                try {
                    await navigator.clipboard.writeText(emailBody);
                } catch (fallbackError) {
                    console.error('Fallback clipboard error:', fallbackError);
                }
            }

            // Clear selection after successful operation
            setSelectedRowIds([]); 
            setModalType(null);
            
            alert(`Success! ${editableDraftData.length} candidates saved. HTML copied to clipboard - paste in Gmail!`);
            
        } catch (error) {
            console.error('Error saving candidates:', error);
            alert("Error saving candidates. Please check console.");
        } finally {
            setIsSendingDraft(false);
        }
    };
    // Copy HTML email to clipboard
   // Copy HTML email to clipboard
 // Copy HTML email to clipboard
  // Copy HTML email to clipboard
    const handleCopyHtmlToClipboard = async () => {
        if (!shareForm.company) {
            alert("Please select a client company first.");
            return;
        }
        
        if (!shareForm.clientId) {
            alert("Invalid client selection.");
            return;
        }
        
        if (!shareForm.toEmail) {
            alert("Please provide recipient email(s).");
            return;
        }
        
        setIsSendingDraft(true);
        
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        
        if (!token) {
            setIsSendingDraft(false);
            alert("Session expired. Please login again.");
            return;
        }
        
        try {
            // 1. Save each candidate to database (corporate_crm_emails)
            for (const row of editableDraftData) {
                await fetch('/api/corporate/crm/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conversation_id: row.id,
                        company_name: shareForm.company,
                        client_id: shareForm.clientId,
                        name: row.name,
                        profile: row.profile,
                        location: row.location,
                        qualification: row.qualification,
                        experience: row.experience,
                        feedback: row.crmFeedback,
                        cv_url: row.tlCvName || '',
                        sent_via: 'Email'
                    })
                });
            }
            
            // 2. Generate HTML Email Content
            const companyName = shareForm.company;
            const subject = `Shortlisted Candidates - ${companyName}`;
            
            // Get current user name for signature (Fallback to Gurmeet Aneja if not found)
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const bdName = userData.name ; 
            
            // Build candidate table rows HTML
            let candidateTableRows = "";
            editableDraftData.forEach((row, i) => {
                let rowBg = i % 2 === 0 ? '#ffffff' : '#faf9fe';
                
                candidateTableRows += `
                    <tr style="background-color: ${rowBg};">
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.name || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.profile || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.location || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.qualification || ""}</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${row.experience || "0"} Years</td>
                        <td style="padding: 16px 15px; color: #333; font-size: 14px; border-bottom: 1px solid #f0f0f0; line-height: 1.5; max-width: 250px;">${row.crmFeedback || ""}</td>
                        <td style="padding: 16px 15px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                            ${row.tlCvName ? `<a href="${row.tlCvName}" target="_blank" style="display: inline-block; background-color: #e6d8f5; color: #5b3b8c; padding: 8px 24px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 13px;">CV</a>` : '-'}
                        </td>
                    </tr>
                `;
            });

            // Exact Match HTML Template with appended Signature
            let htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3eefa; background-image: linear-gradient(to right, #f3eefa 0%, #e0f6eb 100%);">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 850px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: left;">
                                <tr>
                                    <td style="padding: 40px;">
                                        
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <img src="https://mavenjobs.in/wp-content/uploads/2024/01/maven-12-1.png" alt="Maven Jobs Logo" style="height: 45px; width: auto; border: none; display: inline-block;">
                                    </div>

                                    <div style="margin-bottom: 25px;">
                                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #222;">
                                            Hi ${companyName},
                                        </p>
                                        <p style="margin: 0; font-size: 15px; color: #222;">
                                            Please find the shortlisted candidates below:
                                        </p>
                                    </div>

                                    <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; text-align: left; font-family: Arial, sans-serif;">
                                            <thead>
                                                <tr style="background-color: #e6d8f5;">
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Name</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Profile</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Location</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Qualification</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Experience</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px;">Feedback</th>
                                                    <th style="padding: 16px 15px; font-weight: bold; color: #111; font-size: 14px; text-align: center;">Resume</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${candidateTableRows}
                                            </tbody>
                                        </table>
                                    </div>

                                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 35px 0 25px 0;">

                                    <div style="text-align: left; margin-bottom: 15px;">
                                        <span style="font-size: 18px; color: #006400; font-weight: bold;">${bdName}</span>
                                        <span style="font-size: 16px; color: #000000; display: block; font-weight: bold;">
                                            Maven Jobs<br>Recruitment Agency<br>2nd Floor, Sec 25, Panipat
                                        </span>
                                    </div>

                                    <div style="text-align: left;">
                                        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://www.facebook.com/mavenjobspanipat/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/facebook-circle-black-bordered.png" alt="FB" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://twitter.com/Maven_Jobs" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/x-circle-black-bordered.png" alt="X" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://www.instagram.com/mavenjobs/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/instagram-circle-black-bordered.png" alt="IG" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://in.linkedin.com/company/maven-jobs" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/linkedin-circle-black-bordered.png" alt="IN" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://in.pinterest.com/Mavenjobs/" target="_blank">
                                                        <img src="https://evnlkpo.stripocdn.email/content/assets/img/social-icons/circle-black-bordered/pinterest-circle-black-bordered.png" alt="PIN" width="28" height="28" style="display:block; border:0;" />
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                </td>
                            </tr>
                        </table>
                        
                    </td>
                </tr>
            </table>

            <div style="font-family: Arial, sans-serif; padding: 20px 30px; background-color: #ffffff;">
                <div style="color: #333; margin-bottom: 15px;">--</div>
                
                <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                    <tr>
                        <td valign="middle" style="padding-right: 25px; text-align: center;">
                            <img src="https://mavenjobs.in/wp-content/uploads/2024/01/maven-12-1.png" alt="Maven Jobs" width="130" style="display: block; border: none; margin: 0 auto;">
                            <div style="font-size: 11px; color: #0f3f7a; font-weight: bold; margin-top: 6px; letter-spacing: 0.5px;">Join | Connect | Grow</div>
                        </td>
                        
                        <td width="2" style="background-color: #d4d4d4;"></td>
                        
                        <td valign="middle" style="padding-left: 25px;">
                            <div style="font-size: 20px; font-weight: bold; color: #0f3f7a; margin-bottom: 4px;">${bdName}</div>
                            <div style="font-size: 15px; font-weight: bold; color: #666; margin-bottom: 2px;">Business Development Lead</div>
                            <div style="font-size: 15px; font-weight: bold; color: #666; margin-bottom: 12px;">Maven Jobs</div>

                            <table cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #333;">
                                <tr>
                                    <td style="padding-bottom: 8px; padding-right: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">📞</span> 
                                        <span style="vertical-align: middle;">+91 8307075952</span>
                                    </td>
                                    <td style="padding-bottom: 8px; border-left: 2px solid #e0e0e0; padding-left: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">📍</span> 
                                        <span style="vertical-align: middle;">( Gurgaon )</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-right: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">✉</span> 
                                        <a href="mailto:bd@mavenjobs.in" style="color: #0f3f7a; text-decoration: none; vertical-align: middle;">bd@mavenjobs.in</a>
                                    </td>
                                    <td style="border-left: 2px solid #e0e0e0; padding-left: 15px; white-space: nowrap;">
                                        <span style="color: #888; font-size: 16px; vertical-align: middle;">🌐</span> 
                                        <a href="http://www.mavenjobs.in" style="color: #0f3f7a; text-decoration: none; vertical-align: middle;">www.mavenjobs.in</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
            
        </body>
        </html>
        `;
        
            try {
                const blob = new Blob([htmlTemplate], { type: 'text/html' });
                const textBlob = new Blob([htmlTemplate], { type: 'text/plain' });
                
                const item = new ClipboardItem({
                    'text/html': blob,
                    'text/plain': textBlob
                });
                
                await navigator.clipboard.write([item]);
                
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&to=${encodeURIComponent(shareForm.toEmail)}`;
                window.open(gmailUrl, '_blank');
                
                setSelectedRowIds([]); 
                setModalType(null);
                
                alert(`Success! ${editableDraftData.length} candidates saved. HTML copied to clipboard - paste in Gmail!`);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                try {
                    await navigator.clipboard.writeText(htmlTemplate);
                    alert('HTML copied as text. Please paste in Gmail HTML mode.');
                } catch (fallbackError) {
                    alert('Unable to copy to clipboard. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error saving candidates:', error);
            alert("Error saving candidates. Please check console.");
        } finally {
            setIsSendingDraft(false);
        }
    };
    const openTrackerHistory = (candidate) => {
        setSelectedCandidate(candidate);
        setModalType('tracker_history');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-3 md:p-4 relative">
            
          {/* --- HEADER & BULK ACTION BAR --- */}
            <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 min-h-[48px]">
                
                {/* Left Side: Title */}
                <div>
                    <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                        </div>
                        CRM Client Tracker
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 xl:ml-9">
                        Process Trackers & Maintain Interview History
                    </p>
                </div>

                {/* Right Side: Filters + Bulk Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Row Count Badge */}
                    <div className="bg-sky-200 text-black px-4 p-1 rounded-4xl border-[0.5px] border-sky-300 flex justify-center items-center mt-3 py-2 ">
                        <span className="text-[10px] font-black uppercase tracking-widest">Rows: {filteredCrmData.length}</span>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
                        {/* TL Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TL:</label>
                            <select 
                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[150px]"
                                value={selectedTL}
                                onChange={(e) => setSelectedTL(e.target.value)}
                            >
                                <option value="">All TLs</option>
                                {tlUsers.map(tl => (
                                    <option key={tl.user_id} value={tl.name}>{tl.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">From:</label>
                            <input 
                                type="date" 
                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To:</label>
                            <input 
                                type="date" 
                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>

                        {/* Clear Filters */}
                        {(selectedTL || dateRange.start || dateRange.end) && (
                            <button 
                                onClick={() => { setSelectedTL(""); setDateRange({ start: "", end: "" }); }}
                                className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-widest"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Bulk Actions (Appears when rows are selected) */}
                    {selectedRowIds.length > 0 && (
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                {selectedRowIds.length} Selected
                            </span>
                            <button 
                                onClick={openDraftMailModal}
                                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-700 flex items-center gap-1.5 transition-colors"
                            >
                                <Mail size={12}/> Draft Mail
                            </button>
                            <button 
                                onClick={() => {
                                    if (selectedRowIds.length === 0) return alert("Please select candidates to share.");
                                    const selectedData = crmData.filter(c => selectedRowIds.includes(c.id));
                                    const copiedData = JSON.parse(JSON.stringify(selectedData));
                                    copiedData.forEach(item => { item.selected = true; });
                                    setEditableDraftData(copiedData);
                                    setShareForm({ company: "", clientId: "", toEmail: "", mobileNumber: "", manualPhone: "" });
                                    setModalType('whatsapp_share');
                                }}
                                className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 flex items-center gap-1.5 transition-colors"
                            >
                                <MessageCircle size={12}/> Share via WhatsApp
                            </button>
                        </div>
                    )}
                </div>
                
            </div>

            {/* --- MAIN TABLE --- */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto custom-scrollbar min-h-[50vh] pb-3">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1300px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-800 text-white">
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">TL & Date</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600 text-center">RC CV</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">Candidate Name</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">Profile</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">Location</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">Qualification</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">Exp & Rel Exp</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest border-b border-slate-600">CTC (Current / Expected)</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest max-w-[180px] border-b border-slate-600">TL Evaluation</th>
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest text-center border-b border-slate-600">Updated CV</th>
                                
                                {/* Action Column */}
                                <th className="py-2 px-3 text-[9px] font-black uppercase tracking-widest bg-indigo-800/50 sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.2)] text-center border-l border-b border-slate-600 w-32">
                                    <div className="flex flex-col items-center gap-1">
                                        <span>Action</span>
                                        <div className="flex items-center gap-1 bg-slate-800/80 rounded px-1.5 py-0.5 cursor-pointer hover:bg-slate-700" onClick={toggleAllSelection}>
                                            <input 
                                                type="checkbox" 
                                                className="cursor-pointer accent-indigo-500 w-3 h-3"
                                                checked={selectedRowIds.length === filteredCrmData.length && filteredCrmData.length > 0}
                                                readOnly
                                            />
                                            <span className="text-[8px] text-slate-300">Select All</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredCrmData.map((row) => {
                                const isSelected = selectedRowIds.includes(row.id);
                                return (
                                    <tr key={row.id} className={`transition-colors group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                                        
                                        {/* TL & Date */}
                                        <td className="py-2 px-3">
                                            <p className="text-[11px] font-black text-slate-800">{row.tlName}</p>
                                            <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest mt-0.5">
                                                <Calendar size={9} className="text-indigo-400"/> {row.trackerShareDate}
                                            </p>
                                        </td>

                                        {/* RC CV */}
                                        <td className="py-2 px-3 text-center">
                                            <button 
                                                onClick={() => openRcCvModal(row)}
                                                className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 hover:text-amber-700 flex items-center justify-center mx-auto transition-colors shadow-xs"
                                                title="View Raw CV"
                                            >
                                                <FileText size={12} />
                                            </button>
                                        </td>

                                        {/* Candidate Name */}
                                        <td className="py-2 px-3">
                                            <p className="text-[11px] font-black text-slate-800">{row.name}</p>
                                        </td>

                                        {/* Profile */}
                                        <td className="py-2 px-3">
                                            <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                {row.profile}
                                            </span>
                                        </td>

                                        {/* Location */}
                                        <td className="py-2 px-3">
                                            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                                <MapPin size={11} className="text-slate-400"/> {row.location}
                                            </p>
                                        </td>

                                        {/* Qualification */}
                                        <td className="py-2 px-3">
                                            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                                <GraduationCap size={11} className="text-slate-400"/> {row.qualification}
                                            </p>
                                        </td>

                                        {/* Experience */}
                                        <td className="py-2 px-3">
                                            <p className="text-[11px] font-black text-slate-800 mb-0.5">{row.experience} <span className="text-[8px] font-bold text-slate-400">Tot</span></p>
                                            <p className="text-[11px] font-black text-emerald-600">{row.relevantExp} <span className="text-[8px] font-bold text-emerald-400">Rel</span></p>
                                        </td>

                                        {/* CTC */}
                                        <td className="py-2 px-3">
                                            <p className="text-[10px] font-bold text-slate-500 mb-0.5"><span className="w-4 inline-block text-slate-400">C:</span> {row.cCTC}</p>
                                            <p className="text-[10px] font-black text-emerald-700"><span className="w-4 inline-block text-emerald-400 font-bold">E:</span> {row.eCTC}</p>
                                        </td>

                                        {/* TL Evaluation */}
                                        <td className="py-2 px-3 max-w-[180px] whitespace-normal">
                                            <p className="text-[9px] font-medium text-slate-600 italic leading-snug border-l-2 border-amber-400 pl-2">
                                                "{row.tlEvaluation}"
                                            </p>
                                        </td>

                                        {/* View CV File */}
                                        <td className="py-2 px-3 text-center">
                                            <button 
                                                onClick={() => openCVModal(row)}
                                                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 flex items-center justify-center mx-auto transition-colors shadow-xs"
                                                title="View Processed CV"
                                            >
                                                <FileText size={12} />
                                            </button>
                                        </td>

                                        {/* Action Column (Checkbox + Button) */}
                                        <td className="py-2 px-3 sticky right-0 bg-slate-50/50 transition-colors z-10 border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.03)] w-32">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                
                                                <input 
                                                    type="checkbox" 
                                                    className="cursor-pointer accent-indigo-600 w-4 h-4 shadow-xs rounded"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(row.id)}
                                                />

                                                <button 
                                                    onClick={() => router.push(`/corporate/crm/tracker/history/${row.id}`)}
                                                    className="w-full py-1 px-2 rounded-lg bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 flex items-center justify-center gap-1 font-black text-[8px] uppercase tracking-widest transition-all shadow-xs"
                                                >
                                                    <History size={10}/> History
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL 1: EDITABLE DRAFT MAIL TABLE */}
            {/* ========================================================= */}
            {modalType === 'draft_mail' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border-4 border-white">
                        
                        <div className="bg-indigo-600 text-white px-5 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 size={16}/> Edit & Draft Mail
                                </h2>
                                <p className="text-[10px] font-bold text-indigo-200 mt-1">Review and update details before sharing with client.</p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-indigo-200 bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        {/* Client Selection */}
                        <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Client Company</label>
                            <select 
                                className="w-full max-w-sm bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                value={shareForm.company} onChange={(e) => {
                                    const selectedClient = clientCompanies.find(c => c.company_name === e.target.value);
                                    // Combine client email and branch emails
                                    const emails = [];
                                    if (selectedClient?.email) emails.push(selectedClient.email);
                                    if (selectedClient?.branchEmails) {
                                        selectedClient.branchEmails.forEach(email => {
                                            if (!emails.includes(email)) emails.push(email);
                                        });
                                    }
                                    setShareForm({...shareForm, company: e.target.value, clientId: selectedClient?.client_id || '', toEmail: emails.join(', ')});
                                }}
                            >
                                <option value="">-- Choose Client Company --</option>
                                {clientCompanies.map(c => <option key={c.client_id} value={c.company_name}>{c.company_name}</option>)}
                            </select>
                        </div>

                        {/* Recipient Email Field */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">To (Recipients)</label>
                            <input 
                                type="text" 
                                className="w-full bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={shareForm.toEmail}
                                onChange={(e) => setShareForm({...shareForm, toEmail: e.target.value})}
                                placeholder="recipient@example.com"
                            />
                        </div>

                        {/* Editable Table Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                                <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Qualification</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[200px]">CRM Feedback</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {editableDraftData.map(row => (
                                            <tr key={row.id}>
                                                <td className="p-2">
                                                    <input type="text" value={row.name} onChange={(e) => handleEditableDraftChange(row.id, 'name', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.profile} onChange={(e) => handleEditableDraftChange(row.id, 'profile', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.location} onChange={(e) => handleEditableDraftChange(row.id, 'location', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.qualification} onChange={(e) => handleEditableDraftChange(row.id, 'qualification', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={String(row.experience || '')} onChange={(e) => handleEditableDraftChange(row.id, 'experience', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <textarea 
                                                        value={row.crmFeedback || ''}
                                                        onChange={(e) => handleEditableDraftChange(row.id, 'crmFeedback', e.target.value)}
                                                        placeholder="Enter CRM feedback..."
                                                        className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 rounded px-2 py-1 outline-none resize-none"
                                                        rows={2}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => openCVModal(row)}
                                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        <FileText size={12} />
                                                        <span className="truncate max-w-[100px]">{row.tlCvName}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottom Actions: Save Draft Button */}
                        <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-center">
                            <button 
                                onClick={handleSendDraftMail}
                                disabled={!shareForm.company}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                <Send size={14}/> Save Draft & Copy to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: WHATSAPP SHARE */}
            {/* ========================================================= */}
            {modalType === 'whatsapp_share' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border-4 border-white">
                        
                        <div className="bg-emerald-600 text-white px-5 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <MessageCircle size={16}/> Share via WhatsApp
                                </h2>
                                <p className="text-[10px] font-bold text-emerald-200 mt-1">Select candidates to share via WhatsApp.</p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-emerald-200 bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Mobile Number (Recipients)</label>
                            <div className="flex flex-wrap gap-2">
                                <select 
                                    className="bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex-1 min-w-[200px]"
                                    value={shareForm.company}
                                    onChange={(e) => {
                                        const selectedClient = clientCompanies.find(c => c.company_name === e.target.value);
                                        const phones = selectedClient?.branchPhones || [];
                                        setShareForm({
                                            ...shareForm,
                                            company: e.target.value,
                                            clientId: selectedClient?.client_id || '',
                                            mobileNumber: phones.length > 0 ? phones[0] : '',
                                            manualPhone: ''
                                        });
                                    }}
                                >
                                    <option value="">-- Select Client --</option>
                                    {clientCompanies.map(c => (
                                        <option key={c.client_id} value={c.company_name}>{c.company_name}</option>
                                    ))}
                                </select>
                                {(shareForm.company && (clientCompanies.find(c => c.company_name === shareForm.company)?.branchPhones || []).length > 0) ? (
                                    shareForm.mobileNumber === '__manual__' ? (
                                        <input 
                                            type="tel" 
                                            maxLength={10}
                                            className="flex-1 min-w-[200px] bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={shareForm.manualPhone || ''}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setShareForm({...shareForm, manualPhone: digits});
                                            }}
                                            placeholder="Enter mobile number"
                                        />
                                    ) : (
                                        <select 
                                            className="flex-1 min-w-[200px] bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                            value={shareForm.mobileNumber}
                                            onChange={(e) => {
                                                if (e.target.value === '__manual__') {
                                                    setShareForm({...shareForm, mobileNumber: '__manual__'});
                                                } else {
                                                    setShareForm({...shareForm, mobileNumber: e.target.value});
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Phone --</option>
                                            {(clientCompanies.find(c => c.company_name === shareForm.company)?.branchPhones || []).map((phone, idx) => (
                                                <option key={idx} value={phone}>{phone}</option>
                                            ))}
                                            <option value="__manual__">+ Enter Manually</option>
                                        </select>
                                    )
                                ) : (
                                    <input 
                                        type="tel" 
                                        maxLength={10}
                                        className="flex-1 min-w-[200px] bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={shareForm.mobileNumber}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setShareForm({...shareForm, mobileNumber: digits});
                                        }}
                                        placeholder="Enter mobile number"
                                    />
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Select client to see phone numbers or enter manually</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                                <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-10">
                                                <input 
                                                    type="checkbox"
                                                    checked={editableDraftData.length > 0 && editableDraftData.every(row => row.selected)}
                                                    onChange={(e) => setEditableDraftData(editableDraftData.map(row => ({...row, selected: e.target.checked})))}
                                                    className="cursor-pointer accent-emerald-600 w-4 h-4"
                                                />
                                            </th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Qualification</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[200px]">CRM Feedback</th>
                                            <th className="py-2 px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {editableDraftData.map(row => (
                                            <tr key={row.id} className={row.selected ? 'bg-emerald-50' : ''}>
                                                <td className="p-2 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={row.selected || false}
                                                        onChange={(e) => {
                                                            const updated = editableDraftData.map(item => 
                                                                item.id === row.id ? {...item, selected: e.target.checked} : item
                                                            );
                                                            setEditableDraftData(updated);
                                                        }}
                                                        className="cursor-pointer accent-emerald-600 w-4 h-4"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.name} onChange={(e) => handleEditableDraftChange(row.id, 'name', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.profile} onChange={(e) => handleEditableDraftChange(row.id, 'profile', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.location} onChange={(e) => handleEditableDraftChange(row.id, 'location', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={row.qualification} onChange={(e) => handleEditableDraftChange(row.id, 'qualification', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={String(row.experience || '')} onChange={(e) => handleEditableDraftChange(row.id, 'experience', e.target.value)} className="w-full text-xs font-bold border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none"/>
                                                </td>
                                                <td className="p-2">
                                                    <textarea 
                                                        value={row.crmFeedback || ''}
                                                        onChange={(e) => handleEditableDraftChange(row.id, 'crmFeedback', e.target.value)}
                                                        placeholder="Enter CRM feedback..."
                                                        className="w-full text-xs font-medium border border-slate-200 focus:border-emerald-500 rounded px-2 py-1 outline-none resize-none"
                                                        rows={2}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => openCVModal(row)}
                                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        <FileText size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-center gap-4">
                            <button 
                                onClick={async () => {
                                    const selectedRows = editableDraftData.filter(r => r.selected);
                                    if (selectedRows.length === 0) return alert("Please select at least one candidate.");
                                    
                                    const phoneNum = shareForm.mobileNumber === '__manual__' ? shareForm.manualPhone : shareForm.mobileNumber;
                                    if (!phoneNum || phoneNum.length !== 10) {
                                        return alert("Please select or enter a valid 10-digit mobile number.");
                                    }
                                    
                                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                                    const token = session.access_token;
                                    
                                    if (!token) {
                                        return alert("Session expired. Please login again.");
                                    }
                                    
                                    const selectedClient = clientCompanies.find(c => c.company_name === shareForm.company);
                                    const clientId = selectedClient?.client_id;
                                    
                                    if (clientId) {
                                        for (const row of selectedRows) {
                                            await fetch('/api/corporate/crm/emails', {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({
                                                    conversation_id: row.id,
                                                    company_name: shareForm.company,
                                                    client_id: clientId,
                                                    name: row.name,
                                                    profile: row.profile,
                                                    location: row.location,
                                                    qualification: row.qualification,
                                                    experience: row.experience,
                                                    feedback: row.crmFeedback,
                                                    cv_url: row.tlCvName || '',
                                                    sent_via: 'WhatsApp'
                                                })
                                            });
                                        }
                                    }
                                    
                                    const selectedData = selectedRows;
                                    const companyName = shareForm.company || 'Client';
                                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                    const bdName = userData.name || 'Maven Jobs Team';
                                    
                                    let message = `Hi ${companyName},\n\n`;
                                    message += `Greetings from Maven Jobs!\n\n`;
                                    message += `Please find the shortlisted candidates below:\n\n`;
                                    
                                    selectedData.forEach((row, i) => {
                                        message += `${i + 1}. ${row.name}\n`;
                                        message += `   - Profile: ${row.profile || '-'}\n`;
                                        message += `   - Location: ${row.location || '-'}\n`;
                                        message += `   - Exp: ${row.experience || '0'} Years\n`;
                                        if (row.crmFeedback) {
                                            message += `   - Note: ${row.crmFeedback}\n`;
                                        }
                                        if (row.tlCvName) {
                                            message += `   - CV Link: ${row.tlCvName}\n`;
                                        }
                                        message += `\n`;
                                    });
                                    
                                    message += `Please review and let us know your feedback.\n\n`;
                                    message += `Thanks,\n`;
                                    message += `${bdName}\n`;
                                    message += `Maven Jobs`;
                                    
                                    const encodedMessage = encodeURIComponent(message);
                                    const phone = `91${phoneNum}`;
                                    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
                                    
                                    window.open(whatsappUrl, '_blank');
                                    
                                    setSelectedRowIds([]);
                                    setModalType(null);
                                    alert(`Success! ${selectedRows.length} candidates sent via WhatsApp.`);
                                }}
                                disabled={(shareForm.mobileNumber === '__manual__' ? !shareForm.manualPhone || shareForm.manualPhone.length !== 10 : !shareForm.mobileNumber || shareForm.mobileNumber.length !== 10)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                <MessageCircle size={14}/> Send via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: TRACKER HISTORY (BLANK FOR NOW) */}
            {/* ========================================================= */}
            {modalType === 'tracker_history' && selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl min-h-[60vh] overflow-hidden flex flex-col border-4 border-white">
                        <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16}/> Tracker History Panel
                                </h2>
                                <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">
                                    Candidate: {selectedCandidate.name}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-slate-300 bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
                            <History size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest mb-2">Panel is Blank</h3>
                            <p className="text-sm font-medium text-slate-500">Waiting for further instructions to implement this section.</p>
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
                                <FileText size={18}/> {cvViewer.source === 'rc' ? 'Raw CV' : 'Redacted CV'} : {selectedCandidate.name}
                            </h2>
                            <button onClick={() => setCvViewer({isOpen: false, source: null})} className="text-white/70 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-8">
                            <CVPreview 
                                url={cvViewer.source === 'rc' ? selectedCandidate.rcCvName : selectedCandidate.tlCvName}
                                name={selectedCandidate.name}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}