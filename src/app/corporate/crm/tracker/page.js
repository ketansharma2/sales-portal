"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Building2, Mail, History, Calendar, CheckCircle2, 
    X, Send, FileText, Briefcase, MapPin, GraduationCap, Edit3, Loader2
} from "lucide-react";

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
    const [shareForm, setShareForm] = useState({ company: "", clientId: "", toEmail: "" });
    const [editableDraftData, setEditableDraftData] = useState([]); // Holds data for the editable table
    const [clientCompanies, setClientCompanies] = useState([]); // Dynamic client list

    // CV Viewer State
    const [cvViewer, setCvViewer] = useState({ isOpen: false, source: null });
    const [cvBlob, setCvBlob] = useState(null);
    const [isLoadingCV, setIsLoadingCV] = useState(false);
    const [isSendingDraft, setIsSendingDraft] = useState(false);

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

    // --- HANDLERS ---
    // Open CV Modal - Fetch from AWS as blob
    const openCVModal = async (candidate) => {
        setSelectedCandidate(candidate);
        setCvViewer({ isOpen: true, source: 'tl' });
        
        if (candidate.tlCvName) {
            setIsLoadingCV(true);
            try {
                const response = await fetch(candidate.tlCvName);
                
                if (response.ok) {
                    const blob = await response.blob();
                    setCvBlob(blob);
                } else {
                    console.error('Failed to fetch CV:', response.status);
                    setCvBlob(null);
                }
            } catch (error) {
                console.error('Error fetching CV:', error);
                setCvBlob(null);
            } finally {
                setIsLoadingCV(false);
            }
        } else {
            setCvBlob(null);
        }
    };

    const toggleRowSelection = (id) => {
        setSelectedRowIds(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedRowIds.length === crmData.length) {
            setSelectedRowIds([]);
        } else {
            setSelectedRowIds(crmData.map(row => row.id));
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
        setShareForm({ company: "", clientId: "", toEmail: "" });
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
        if (!shareForm.clientId) return alert("Invalid client selection.");
        if (!shareForm.toEmail) return alert("Please provide recipient email(s).");
        
        setIsSendingDraft(true);
        
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        
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
                        cv_url: row.tlCvName || ''
                    })
                });
            }
            
            // 2. Generate HTML Email Content
            const companyName = shareForm.company;
            const subject = `Shortlisted Candidates - ${companyName}`;
            
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const bdName = userData.name || userData.email || 'Maven Jobs Team';
            
            let candidateTableRows = "";
            editableDraftData.forEach((row, i) => {
                let rowBg = i % 2 === 1 ? '#fcf9ff' : '#ffffff';
                candidateTableRows += `
                    <tr style="background:${rowBg};">
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:14px; color:#444; border-bottom:1px solid #f0f0f0;">${row.name || ""}</td>
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:14px; color:#444; border-bottom:1px solid #f0f0f0;">${row.profile || ""}</td>
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:14px; color:#444; border-bottom:1px solid #f0f0f0;">${row.location || ""}</td>
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:14px; color:#444; border-bottom:1px solid #f0f0f0;">${row.qualification || ""}</td>
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:14px; color:#444; border-bottom:1px solid #f0f0f0;">${row.experience || "0"} Years</td>
                        <td style="padding:14px; font-family:'Poppins', Arial, sans-serif; font-size:13px; color:#555; border-bottom:1px solid #f0f0f0; line-height:1.4;">${row.crmFeedback || ""}</td>
                        <td style="padding:14px; text-align:center; border-bottom:1px solid #f0f0f0;">
                            ${row.tlCvName ? `<a href="${row.tlCvName}" target="_blank" style="display:inline-block; background-color:#eadef2; color:#1e4787 !important; padding:8px 20px; border-radius:20px; text-decoration:none; font-weight:600; font-size:13px; font-family:'Poppins', Arial, sans-serif;">CV</a>` : '-'}
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
<body style="margin:0; padding:0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4e8fb;">
    <div style="background: linear-gradient(135deg, #f4e8fb 0%, #eef4fc 50%, #dbf8ed 100%); padding: 40px 20px;">
        <div style="max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 40px;">
            <div style="text-align:center; margin-bottom:24px;">
                <img src="https://mli2w8imrnr8.i.optimole.com/w:320/h:80/q:mauto/f:best/https://mavenjobs.in/wp-content/uploads/2024/01/maven-12-1.png" alt="Maven Jobs Logo" width="192" height="48" style="display:block; margin:0 auto; max-width:192px; width:100%; height:auto;">
            </div>
            <div style="margin-bottom:24px;">
                <p style="margin:0 0 12px 0; font-size:15px; color:#333; font-family:'Poppins','Inter','Helvetica Neue',Calibri,Roboto,'Segoe UI','Noto Sans',Geneva,Arial,sans-serif;">Hi ${companyName},</p>
                <p style="margin:0 0 20px 0; font-size:15px; color:#333; font-family:'Poppins','Inter','Helvetica Neue',Calibri,Roboto,'Segoe UI','Noto Sans',Geneva,Arial,sans-serif;">Please find the shortlisted candidates below:</p>
            </div>
            <div style="border-radius: 16px; overflow: hidden; border: 1px solid #eef0f2;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; font-family:'Poppins','Inter','Helvetica Neue',Calibri,Roboto,'Segoe UI','Noto Sans',Geneva,Arial,sans-serif; font-size:14px; color:#444;">
                    <thead>
                        <tr style="background-color:#eadef2;">
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:140px;">Name</th>
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:170px;">Profile</th>
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:110px;">Location</th>
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:110px;">Qualification</th>
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:75px;">Experience</th>
                            <th style="padding:14px; text-align:left; font-weight:600; color:#111; width:180px;">Feedback</th>
                            <th style="padding:14px; text-align:center; font-weight:600; color:#111; width:70px;">Resume</th>
                        </tr>
                    </thead>
                    <tbody>${candidateTableRows}</tbody>
                </table>
            </div>
            <div style="margin-top:40px; margin-bottom:10px;">
                <span style="font-family:Cambria,Georgia,'Times New Roman',serif; font-size:17px; color:#006400; font-weight:bold;">${bdName}</span>
                <span style="font-family:Cambria,Georgia,'Times New Roman',serif; font-size:15px; color:#1e4787; display:block; font-weight:bold; line-height:1.5;">
                    <br>Maven Jobs<br>Recruitment Agency<br>2nd Floor, Sec 25, Panipat
                </span>
            </div>
        </div>
    </div>
</body>
</html>`;

            // 3. CALL DRAFT API (New Code)
            // Note: Replace '/api/create-gmail-draft' with your actual backend route URL if different
            const apiResponse = await fetch('/api/create-gmail-draft', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toEmail: shareForm.toEmail,
                    subject: subject,
                    htmlBody: emailBody
                })
            });

            if (!apiResponse.ok) {
                throw new Error('Failed to create draft on backend');
            }

            // Clear selection after successful draft creation
            setSelectedRowIds([]); 
            setModalType(null);
            
            alert(`Success! Saved ${editableDraftData.length} candidates and Draft created in your Gmail.`);
            
        } catch (error) {
            console.error('Error saving/drafting emails:', error);
            alert("Error creating email draft. Please check console.");
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
        
        const companyName = shareForm.company;
        const subject = `Shortlisted Candidates - ${companyName}`;
        
        // Get current user name for signature (Fallback to Gurmeet Aneja if not found)
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const bdName = userData.name || 'Gurmeet Aneja'; 
        
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

                                    <div style="text-align: center;">
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
            
            alert(`HTML email copied to clipboard!\n\nSubject: ${subject}\n\nNow open Gmail and paste (Ctrl+V / Cmd+V) in the email body.`);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            try {
                await navigator.clipboard.writeText(htmlTemplate);
                alert('HTML copied as text. Please paste in Gmail HTML mode.');
            } catch (fallbackError) {
                alert('Unable to copy to clipboard. Please try again.');
            }
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

                {/* Right Side: Bulk Actions (Appears when rows are selected) */}
                <div>
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
                                                checked={selectedRowIds.length === crmData.length && crmData.length > 0}
                                                readOnly
                                            />
                                            <span className="text-[8px] text-slate-300">Select All</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {crmData.map((row) => {
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

                        {/* Bottom Actions: Draft Mail Button */}
                        <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
                            <button 
                                onClick={handleCopyHtmlToClipboard}
                                disabled={isSendingDraft || !shareForm.company}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                <Send size={14}/> Copy HTML
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setModalType(null)} className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 hover:text-slate-700">Cancel</button>
                                <button 
                                    onClick={handleSendDraftMail}
                                    disabled={isSendingDraft}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSendingDraft ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin"/> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14}/> Draft Mail
                                        </>
                                    )}
                                </button>
                            </div>
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
                                <FileText size={18}/> Redacted CV : {selectedCandidate.name}
                            </h2>
                            <button onClick={() => setCvViewer({isOpen: false, source: null})} className="text-white/70 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-8">
                            {isLoadingCV ? (
                                <div className="text-center text-slate-500">
                                    <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                                    <p className="text-lg font-black uppercase tracking-widest mb-1">Loading CV...</p>
                                </div>
                            ) : cvBlob ? (
                                <iframe 
                                    src={URL.createObjectURL(cvBlob)}
                                    className="w-full h-full rounded-lg border border-slate-300"
                                    title="CV Viewer"
                                />
                            ) : (
                                <div className="text-center text-slate-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-black uppercase tracking-widest mb-1">No CV Available</p>
                                    <p className="text-xs font-bold">File: {selectedCandidate.tlCvName || 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}