"use client";
import { useState, useEffect, useMemo } from "react";
import {
  FileText, Plus, X, Briefcase, Users, Loader2,
  MapPin, IndianRupee, Calendar, Globe, Eye, Download
} from "lucide-react";
import jsPDF from "jspdf";

export default function JobRequirementsPage() {
  
  // ==========================================
  // 1. ALL STATE DECLARATIONS FIRST
  // ==========================================
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [branchesList, setBranchesList] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [requirementsList, setRequirementsList] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [jobpostUsers, setJobpostUsers] = useState([]);
  const [loadingJobpostUsers, setLoadingJobpostUsers] = useState(true);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);

  // JD View Modal State
  const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
  const [currentJdView, setCurrentJdView] = useState(null);

  // Form State
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const initialForm = {
    date: getTodayDate(),
    client_name: '',
    jd_id: '',
    job_title: '',
    location: '',
    package: '',
    assigned_to: ''
  };
  const [inlineForm, setInlineForm] = useState(initialForm);
  
  // CV Modal Data (static, no need for useState)
  const cvModalData = {
    postings: [
      { id: 1, platform: 'Naukri', posted_on: '11 May 2026', live_url: '#', current_stage: 'Active' }
    ],
    cvLogs: [
      { id: 1, date: '12 May 2026', platform: 'Naukri', cv_received: 20, calls_done: 15 }
    ]
  };

  // ==========================================
  // 2. MEMOIZED VALUES
  // ==========================================
  const clientNames = useMemo(() => {
    return clientsList.map(c => c.company_name).sort();
  }, [clientsList]);

  const availableProfilesForClient = useMemo(() => {
    return requirementsList;
  }, [requirementsList]);

  // JDs state for JD preview (from requirements)
  const [jds, setJds] = useState([]);

  // ==========================================
  // 3. ALL useEffect HOOKS
  // ==========================================
  
  // Fetch Clients
  useEffect(() => {
    let isMounted = true;
    
    const fetchClients = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/domestic/crm/clients', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (isMounted && data.success) {
          setClientsList(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        if (isMounted) setLoadingClients(false);
      }
    };
    fetchClients();
    
    return () => {
      isMounted = false;
    };
   }, []);

   // Fetch Jobpost Users
   useEffect(() => {
     let isMounted = true;

     const fetchJobpostUsers = async () => {
       try {
         const session = JSON.parse(localStorage.getItem('session') || '{}');
         const response = await fetch('/api/domestic/crm/jd/jobpost-users', {
           headers: {
             'Authorization': `Bearer ${session.access_token}`
           }
         });
         const data = await response.json();
         console.log("data", data);
         
         if (isMounted) {
           setJobpostUsers(data);
           
           // --- यहीं पर डिफ़ॉल्ट यूज़र सेट कर दें ---
           // अगर डेटा मौजूद है और कम से कम 1 यूज़र है
           if (data && data.length > 0) {
             setInlineForm(prev => ({
               ...prev,
               assigned_to: data[0].user_id // पहले यूज़र की ID सेट करें
             }));
           }
         }
        
       } catch (error) {
         console.error('Failed to fetch jobpost users:', error);
       } finally {
         if (isMounted) setLoadingJobpostUsers(false);
       }
     };
     
     fetchJobpostUsers();

     return () => {
       isMounted = false;
     };
   }, []); // inlineForm को dependency array में मत डालना, नहीं तो इनफिनिट लूप बन सकता है

   // Fetch Branches when client is selected
  useEffect(() => {
    let isMounted = true;
    
    if (!inlineForm.client_name) {
      if (isMounted) {
        setBranchesList([]);
        setRequirementsList([]);
      }
      return;
    }

    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const selectedClient = clientsList.find(c => c.company_name === inlineForm.client_name);
        if (!selectedClient) return;
        
        const response = await fetch(`/api/domestic/crm/branches?client_id=${selectedClient.client_id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (isMounted && data.success) {
          setBranchesList(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    };
    fetchBranches();
    
    return () => {
      isMounted = false;
    };
  }, [inlineForm.client_name, clientsList]);

  // Fetch Requirements when branches are loaded
  useEffect(() => {
    let isMounted = true;
    
    const fetchRequirements = async () => {
      if (branchesList.length === 0) {
        if (isMounted) {
          setRequirementsList([]);
          setJds([]);
        }
        return;
      }

      setLoadingRequirements(true);
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const branchIds = branchesList.map(b => b.branch_id).join(',');
        const response = await fetch(`/api/domestic/crm/requirements?branch_ids=${branchIds}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        
        if (isMounted && data.success) {
          setRequirementsList(data.data);
          // Transform requirements data to JD format for display
          const transformedJDs = data.data.map(req => ({
            jd_id: req.req_id.toString(),
            created_date: req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            client_name: req.client_name || 'Internal',
            job_title: req.job_title,
            location: req.location,
            experience: req.experience,
            employment_type: req.employment_type,
            working_days: req.working_days,
            timings: req.timings,
            package: req.package,
            tool_requirement: req.tool_req,
            job_summary: req.job_summary,
            rnr: req.rnr,
            req_skills: req.req_skills,
            preferred_qual: req.preferred_qual,
            company_offers: req.company_offers,
            contact_details: req.contact_details,
            status: 'Live',
            totalCVs: 0
          }));
          setJds(transformedJDs);
        }
      } catch (error) {
        console.error('Failed to fetch requirements:', error);
        if (isMounted) setJds([]);
      } finally {
        if (isMounted) {
          setLoadingRequirements(false);
        }
      }
    };
    
    fetchRequirements();
    
    return () => {
      isMounted = false;
    };
  }, [branchesList]);

  // Fetch Jobpost Assignments
  useEffect(() => {
    let isMounted = true;

    const fetchAssignments = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/domestic/crm/jobpost/make', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (isMounted && data.success) {
          setAssignments(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        if (isMounted) setAssignments([]);
      } finally {
        if (isMounted) setLoadingAssignments(false);
      }
    };
    fetchAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // 4. EVENT HANDLERS
  // ==========================================

  const handleClientChange = (e) => {
    setInlineForm(prev => ({
      ...prev,
      client_name: e.target.value,
      jd_id: '',
      job_title: '',
      location: '',
      package: ''
    }));
  };

  const handleProfileChange = (e) => {
    const selectedReqId = e.target.value;
    const foundReq = requirementsList.find(req => req.req_id.toString() === selectedReqId);

    if (foundReq) {
      setInlineForm(prev => ({
        ...prev,
        jd_id: foundReq.req_id,
        job_title: foundReq.job_title,
        location: foundReq.location || '',
        package: foundReq.package || ''
      }));
    } else {
      setInlineForm(prev => ({ ...prev, jd_id: '', job_title: '', location: '', package: '' }));
    }
  };

  const handleAssign = async () => {
    if (!inlineForm.client_name || !inlineForm.job_title) {
      alert("Please select Client and Profile to Assign.");
      return;
    }

    if (!inlineForm.assigned_to) {
      alert("Please select a user to assign to.");
      return;
    }

    const selectedRequirement = requirementsList.find(r => r.req_id.toString() === inlineForm.jd_id.toString());

    if (!selectedRequirement) {
      alert("Please select a valid profile from the dropdown!");
      return;
    }

      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/domestic/crm/jobpost/make', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date: inlineForm.date,
            client_id: clientsList.find(c => c.company_name === inlineForm.client_name)?.client_id,
            req_id: selectedRequirement.req_id,
            job_title: inlineForm.job_title,
            location: inlineForm.location,
            pkg: inlineForm.package,
            branch_id: selectedRequirement.branch_id,
            assigned_to: inlineForm.assigned_to
          })
        });

        const data = await response.json();

        if (data.success) {
          alert(`Job Post Assignment Created successfully for ${inlineForm.job_title}!`);
          // Refresh assignments
          const refreshResponse = await fetch('/api/domestic/crm/jobpost/make', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setAssignments(refreshData.data);
          }
          // Reset form but keep date
          setInlineForm({
            date: new Date().toISOString().split('T')[0],
            client_name: '', jd_id: '', job_title: '', location: '', package: '', assigned_to: ''
          });
          // Clear branches and requirements to reset
          setBranchesList([]);
          setRequirementsList([]);
        } else {
          alert(`Failed to create assignment: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating assignment:', error);
        alert("Failed to create assignment. Please try again.");
      }
  };

  const handlePreview = (jdId) => {
    if (!jdId) return;
    const jd = jds.find(j => j.jd_id === jdId);
    if (jd) {
      localStorage.setItem('previewJD', JSON.stringify(jd));
      window.open('/crm/jdview', '_blank');
    }
  };

  const fetchCVModalData = (jdId) => {
    setSelectedJD(jds.find(j => j.jd_id === jdId));
    setIsCVModalOpen(true);
  };

  const generateJobpostPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const topGap = 15;
    const bottomGap = 15;
    let y = topGap;

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 55, 127);
    doc.text("MAVEN JOBS", leftMargin, y);
    y += 25;

    finishJobpostPDF(doc, y, pageWidth, pageHeight, leftMargin, rightMargin, contentWidth, topGap, bottomGap);
  };

  const finishJobpostPDF = (doc, y, pageWidth, pageHeight, leftMargin, rightMargin, contentWidth, topGap, bottomGap) => {
    const containerHeight = pageHeight - topGap - bottomGap;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, y, contentWidth, containerHeight - 15);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const fields = [
      { label: "JOB TITLE", value: currentJdView.job_title },
      { label: "LOCATION", value: currentJdView.location },
      { label: "EXPERIENCE", value: currentJdView.experience },
      { label: "EMPLOYMENT TYPE", value: currentJdView.employment_type },
      { label: "WORKING DAYS", value: currentJdView.working_days },
      { label: "TIMINGS", value: currentJdView.timings },
      { label: "PACKAGE", value: currentJdView.package },
      { label: "TOOL REQUIREMENT", value: currentJdView.tool_requirement }
    ];

    fields.forEach(field => {
      if (field.value) {
        const addNewPageIfNeeded = (currentY) => {
          if (currentY + 10 >= pageHeight - 50) {
            doc.addPage();
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            let newY = topGap;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(16, 55, 127);
            doc.text("MAVEN JOBS", leftMargin, newY);
            newY += 25;
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
            return newY + 10;
          }
          return currentY;
        };

        y = addNewPageIfNeeded(y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${field.label} : `, leftMargin + 5, y);
        const labelWidth = doc.getTextWidth(`${field.label} : `);
        doc.setFont("helvetica", "normal");
        doc.text(field.value, leftMargin + 5 + labelWidth, y);
        y += 6;
      }
    });

    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(leftMargin + 5, y, pageWidth - rightMargin - 5, y);
    y += 8;

    if (currentJdView.job_summary) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Job Summary :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitSummary = doc.splitTextToSize(currentJdView.job_summary, contentWidth - 10);
      splitSummary.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(line, leftMargin + 5, y);
        y += 5;
      });
      y += 8;
      doc.setTextColor(0, 0, 0);
    }

    if (currentJdView.rnr) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Role & Responsibilities :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const rnrLines = currentJdView.rnr.split('\n').filter(l => l.trim());
      rnrLines.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(`• ${line.trim()}`, leftMargin + 5, y);
        y += 5;
      });
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    if (currentJdView.req_skills) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Required Skills :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const skillLines = currentJdView.req_skills.split(',').filter(l => l.trim());
      skillLines.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(`• ${line.trim()}`, leftMargin + 5, y);
        y += 5;
      });
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    if (currentJdView.preferred_qual) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Preferred Qualifications :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const qualLines = currentJdView.preferred_qual.split('\n').filter(l => l.trim());
      qualLines.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(`• ${line.trim()}`, leftMargin + 5, y);
        y += 5;
      });
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    if (currentJdView.company_offers) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("What Company Offer :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const offerLines = currentJdView.company_offers.split('\n').filter(l => l.trim());
      offerLines.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(`• ${line.trim()}`, leftMargin + 5, y);
        y += 5;
      });
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    if (currentJdView.contact_details) {
      const addNewPageIfNeeded = (currentY) => {
        if (currentY + 10 >= pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          let newY = topGap;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(16, 55, 127);
          doc.text("MAVEN JOBS", leftMargin, newY);
          newY += 25;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(leftMargin, newY, contentWidth, containerHeight - 15);
          return newY + 10;
        }
        return currentY;
      };

      y = addNewPageIfNeeded(y);
      y += 8;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(leftMargin + 5, y, pageWidth - rightMargin - 5, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Contact Us To Apply :", leftMargin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const contactLines = doc.splitTextToSize(currentJdView.contact_details, contentWidth - 10);
      contactLines.forEach(line => {
        y = addNewPageIfNeeded(y);
        doc.text(line, leftMargin + 5, y);
        y += 5;
      });
    }

    const fileName = currentJdView.job_title ? `${currentJdView.job_title.replace(/\s+/g, '_')}_JD.pdf` : 'Job_Description.pdf';
    doc.save(fileName);
  };

  // ==========================================
  // 5. RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2 print:p-0 print:bg-white">
      
      {/* HEADER */}
      <div className="mb-2 print:hidden">
        <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Post Job Requirements</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign validated mandates to the Job Posting Team</p>
      </div>

      {/* SMART INLINE CREATION ROW */}
     <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-2 print:hidden relative overflow-hidden">
  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#103c7f] rounded-l-xl"></div>
  
  <div className="p-2 pl-3">
    <h3 className="text-[11px] font-black text-[#103c7f] uppercase tracking-widest mb-2 flex items-center gap-1.5">
      <Plus size={14} /> Create New Assignment
    </h3>
    
    {/* Add horizontal scroll on small screens */}
    <div className="overflow-x-auto">
      <div className="min-w-[800px] lg:min-w-0">
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
            
          {/* Date */}
          <div className="w-full sm:w-auto md:w-[110px] shrink-0">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Date</label>
            <input 
              type="date" 
              value={inlineForm.date}
              onChange={(e) => setInlineForm({...inlineForm, date: e.target.value})}
              className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 shadow-sm transition-all" 
            />
          </div>
          
          {/* Client Name */}
          <div className="w-full sm:w-auto md:w-[180px] shrink-0">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Client Name</label>
            <select 
              value={inlineForm.client_name}
              onChange={handleClientChange}
              className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white cursor-pointer shadow-sm transition-all"
            >
              <option value="">Select Client</option>
              {clientNames.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Profile */}
          <div className="w-full sm:w-auto lg:flex-1 shrink-0 min-w-[180px]">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Profile</label>
            <select
              value={inlineForm.jd_id}
              onChange={handleProfileChange}
              disabled={!inlineForm.client_name || loadingBranches || loadingRequirements}
              className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 shadow-sm transition-all"
            >
              <option value="">
                {loadingClients ? "Loading clients..." :
                 !inlineForm.client_name ? "Select client first" :
                 loadingBranches ? "Loading branches..." :
                 loadingRequirements ? "Loading profiles..." : "Select Profile"}
              </option>
              {availableProfilesForClient.map((req) => (
                <option key={req.req_id} value={req.req_id}>{req.job_title}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="w-full sm:w-auto md:w-[100px] shrink-0">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Location</label>
            <input 
              type="text" 
              placeholder="e.g. Pune" 
              value={inlineForm.location}
              onChange={(e) => setInlineForm({...inlineForm, location: e.target.value})}
              disabled={!inlineForm.jd_id}
              className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] disabled:bg-gray-50 shadow-sm transition-all" 
            />
          </div>

           {/* Package */}
           <div className="w-full sm:w-auto md:w-[100px] shrink-0">
             <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Package</label>
             <input
               type="text"
               placeholder="e.g. 10 LPA"
               value={inlineForm.package}
               onChange={(e) => setInlineForm({...inlineForm, package: e.target.value})}
               disabled={!inlineForm.jd_id}
               className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] disabled:bg-gray-50 shadow-sm transition-all"
             />
           </div>

           {/* Assign To */}
         

             {/* View JD Button */}
            <div className="w-full md:w-[100px] shrink-0">
              <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block select-none">View JD</label>
              <button
                onClick={() => {
                  const selectedReq = requirementsList.find(r => r.req_id.toString() === inlineForm.jd_id.toString());
                  if (selectedReq) {
                    setCurrentJdView(selectedReq);
                    setIsJdViewModalOpen(true);
                  }
                }}
                disabled={!inlineForm.jd_id}
                className="w-full h-9 flex items-center justify-center gap-1.5 border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Eye size={14} className={inlineForm.jd_id ? "text-blue-500" : "text-gray-400"} /> View JD
              </button>
              
            </div>

              <div className="w-full sm:w-auto md:w-[100px] shrink-0">
             <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Assign To</label>
             <select
               value={inlineForm.assigned_to}
               onChange={(e) => setInlineForm({...inlineForm, assigned_to: e.target.value})}
               disabled={loadingJobpostUsers}
               className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 shadow-sm transition-all"
             >
               <option value="">
                 {loadingJobpostUsers ? "Loading users..." : "Select User"}
               </option>
               {jobpostUsers.map((user) => (
                 <option key={user.user_id} value={user.user_id}>{user.name}</option>
               ))}
             </select>
           </div>

          {/* Assign Button */}
          <div className="w-full sm:w-auto md:w-[120px] shrink-0">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block select-none">Assign</label>
            <button 
              onClick={handleAssign} 
              className="w-full h-9 flex items-center justify-center gap-1.5 bg-[#103c7f] hover:bg-blue-900 text-white px-4 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-md"
            >
              <Plus size={14} /> Assign
            </button>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</div>

      {/* MAIN TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#103c7f] text-white text-[11px] font-bold uppercase sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-blue-800 whitespace-nowrap">Create Date</th>
                <th className="p-3 border-r border-blue-800">Client Name</th>
                <th className="p-3 border-r border-blue-800 w-64">Job Title</th>
                <th className="p-3 border-r border-blue-800">Location & Package</th>
                <th className="p-3 border-r border-blue-800 text-center">JD</th>
                <th className="p-3 border-r border-blue-800 text-center">Post Status</th>
                <th className="p-3 text-center">Applications Received</th>
              </tr>
            </thead>
                <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                    {loadingAssignments ? (
                      <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading jobpost assignments...</td></tr>
                    ) : assignments.length === 0 ? (
                      <tr><td colSpan={7} className="p-4 text-center text-gray-500">No jobpost assignments found.</td></tr>
                    ) : (
                    assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-blue-50/20 transition group">
                    <td className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-500 font-bold align-middle">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400"/> {assignment.date}
                      </div>
                    </td>
                    <td className="p-2 border-r border-gray-100 font-bold text-gray-800 align-middle">
                      {assignment.client_name || "Internal"}
                    </td>
                    <td className="p-2 border-r border-gray-100 font-bold text-[#103c7f] text-sm leading-tight align-middle">
                      {assignment.job_title}
                    </td>
                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-start gap-1 text-gray-600">
                          <MapPin size={12} className="mt-0.5 shrink-0"/> {assignment.location}
                        </span>
                        <span className="flex items-center gap-1 font-mono font-bold text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100">
                          <IndianRupee size={12}/> {assignment.package}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <button
                        onClick={() => {
                          setCurrentJdView(assignment.req_data || assignment);
                          setIsJdViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 mx-auto font-bold text-[10px] uppercase tracking-widest"
                        title="View Full JD"
                      >
                        <Eye size={12}/> View JD
                      </button>
                    </td>

                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border whitespace-nowrap ${
                          assignment.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          assignment.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {assignment.status || 'Assigned'}
                        </span>
                      </div>
                    </td>

                  <td className="p-2 text-center align-middle">
                      <div className="flex justify-center gap-2"> {/* Added gap-2 for spacing between buttons */}
                        {/* Existing View Apps Button */}
                        <button
                          onClick={() => fetchCVModalData(assignment.id)}
                          className="flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-md border border-purple-100 transition-colors font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                          title="View Applications Data"
                        >
                          <Users size={12}/> 0 Apps
                        </button>

                        {/* NEW: View CVs Button */}
                        <button
                          onClick={() => {
                            // Add your logic to view CVs here
                            // e.g., openViewCVsModal(assignment.id)
                          }}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-md border border-indigo-100 transition-colors font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                          title="View Candidate CVs"
                        >
                          <FileText size={12}/> View CVs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW APPLICANTS MODAL */}
      {isCVModalOpen && selectedJD && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative z-[10000]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-blue-50 text-[#103c7f] rounded-lg border border-blue-100">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight">Applications Data</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-0.5">
                    <Briefcase size={12} /> {selectedJD.job_title} 
                    <span className="text-gray-300">|</span> 
                    <span className="text-[10px]">Client: {selectedJD.client_name || "Internal"}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsCVModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 transition bg-gray-50 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3 border-r border-blue-800/30">Date</th>
                      <th className="p-3 border-r border-blue-800/30">Candidate Name</th>
                      <th className="p-3 border-r border-blue-800/30 text-center">CV Link</th>
                      <th className="p-3">Latest Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr className="hover:bg-blue-50/30 transition">
                      <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">12 May 2026</td>
                      <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Rahul Sharma</td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                          <FileText size={12}/> View CV
                        </a>
                      </td>
                      <td className="p-3 text-gray-600 italic">Interview scheduled for next Monday. Good technical skills.</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30 transition">
                      <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">13 May 2026</td>
                      <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Priya Desai</td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                          <FileText size={12}/> View CV
                        </a>
                      </td>
                      <td className="p-3 text-gray-600 italic">Rejected. Expected salary too high.</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30 transition">
                      <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">14 May 2026</td>
                      <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Amit Verma</td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                          <FileText size={12}/> View CV
                        </a>
                      </td>
                      <td className="p-3 text-gray-600 italic">Pending HR round.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- JD VIEW MODAL --- */}
      {isJdViewModalOpen && currentJdView && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[10000] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto">

          <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none print:overflow-visible">

            {/* Header (Hidden in Print) */}
            <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
              <div className="flex items-center gap-3">
                <FileText size={20} />
                <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
              </div>
              <div className="flex gap-3">
                <button onClick={generateJobpostPDF} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                  <Download size={16}/> Save as PDF
                </button>
                <button onClick={() => setIsJdViewModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                  <X size={20}/>
                </button>
              </div>
            </div>

            {/* --- PDF CONTENT --- */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:block print:overflow-visible print:bg-white print:p-0 custom-scrollbar">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none" id="pdf-content">

                {/* 1. Header Logo */}
                <div className="mb-10">
                  <img src="/maven-logo.png" alt="Maven Jobs" style={{ width: '220px', height: '70px', objectFit: 'contain' }} />
                </div>

                {/* 2. Bordered Container */}
                <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">

                  {/* Key Value Pairs */}
                  <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                    {currentJdView.job_title && <p><span className="font-bold">JOB TITLE : </span> {currentJdView.job_title}</p>}
                    {currentJdView.location && <p><span className="font-bold">LOCATION : </span> {currentJdView.location}</p>}
                    {currentJdView.experience && <p><span className="font-bold">EXPERIENCE : </span> {currentJdView.experience}</p>}
                    {currentJdView.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {currentJdView.employment_type}</p>}
                    {currentJdView.working_days && <p><span className="font-bold">WORKING DAYS : </span> {currentJdView.working_days}</p>}
                    {currentJdView.timings && <p><span className="font-bold">TIMINGS : </span> {currentJdView.timings}</p>}
                    {currentJdView.package && <p><span className="font-bold">PACKAGE : </span> {currentJdView.package}</p>}
                    {currentJdView.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {currentJdView.tool_requirement}</p>}
                  </div>

                  {/* Sections */}
                  <div className="space-y-8 text-[15px]">
                    {currentJdView.job_summary && (
                      <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{currentJdView.job_summary}</p></div>
                    )}

                    {currentJdView.rnr && (
                      <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                          {currentJdView.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                        </ul>
                      </div>
                    )}

                    {currentJdView.req_skills && (
                      <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                          {currentJdView.req_skills.split(',').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                        </ul>
                      </div>
                    )}

                    {currentJdView.preferred_qual && (
                      <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                          {currentJdView.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                        </ul>
                      </div>
                    )}

                    {currentJdView.company_offers && (
                      <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                          {currentJdView.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                        </ul>
                      </div>
                    )}

                    {currentJdView.contact_details && (
                      <div className="mt-12 pt-6 border-t border-black/20">
                        <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                        <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{currentJdView.contact_details}</div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}