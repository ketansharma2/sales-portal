"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  HelpCircle, Plus, Search, Edit, Trash2, FileText, 
  X, Building2, Briefcase, MessageSquare, AlertCircle, Printer, Download
} from "lucide-react";

export default function FAQManagement() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Load html2canvas and jspdf on mount
  useEffect(() => {
    const loadLibs = async () => {
      if (window.jspdf && window.html2canvas) return;
      
      const [{ jsPDF: jspdfModule }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      window.jspdf = jspdfModule;
      window.html2canvas = html2canvasModule.default || html2canvasModule;
    };
    
    loadLibs().catch(console.error);
  }, []);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [pdfFAQ, setPdfFAQ] = useState(null); // State for PDF View
  const pdfRef = useRef(null);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('faq-pdf-content');
    if (!element) {
      alert('Content not found');
      return;
    }
    
    // Try html2canvas approach first
    try {
      // Dynamic import
      const [{ jsPDF: jspdfModule }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = jspdfModule;
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('faq-pdf-content');
          if (!clonedElement) return;
          
          clonedElement.style.backgroundColor = '#ffffff';
          
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el);
            const computedColor = style.color;
            const computedBg = style.backgroundColor;
            
            if (computedColor && computedColor.includes('oklch')) {
              el.style.color = '#0f172a';
            }
            if (computedBg && (computedBg.includes('oklch') || computedBg.includes('slate'))) {
              el.style.backgroundColor = '';
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${pdfFAQ.client_name || 'FAQ'}_${pdfFAQ.job_title || 'Document'}.pdf`);
      return;
    } catch (err) {
      console.warn('html2canvas failed, using fallback:', err.message);
    }
    
    // Fallback: text-based PDF
    try {
      const [{ jsPDF }] = await Promise.all([import('jspdf')]);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;
      
      // Add logo
      try {
        pdf.addImage('/maven-logo.png', 'PNG', margin, y, 60, 20);
        y += 30;
      } catch (e) { y += 20; }
      
      // Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 60, 127);
      pdf.text('FAQ - Frequently Asked Questions', margin, y);
      y += 15;
      
      // Client & Profile Info
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y, pageWidth - 2 * margin, 20);
      y += 8;
      
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text('Client:', margin + 5, y);
      pdf.setTextColor(16, 60, 127);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pdfFAQ.client_name || '', margin + 25, y);
      
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Profile:', margin + 85, y);
      pdf.setTextColor(0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pdfFAQ.job_title || '', margin + 105, y);
      
      y += 20;
      
      // Questions Header
      pdf.setFontSize(14);
      pdf.setTextColor(16, 60, 127);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Questions:', margin, y);
      y += 10;
      
      // Questions
      const questions = pdfFAQ.questions || [];
      questions.forEach((qa, index) => {
        pdf.setFontSize(11);
        pdf.setTextColor(0);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Q${index + 1}.`, margin, y);
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(qa.question || '', pageWidth - 2 * margin - 15);
        pdf.text(lines, margin + 10, y);
        y += lines.length * 5 + 3;
      });
      
      // Footer
      y += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text('Confidential Document - Maven Jobs', pageWidth / 2, y, { align: 'center' });
      
      pdf.save(`${pdfFAQ.client_name || 'FAQ'}_${pdfFAQ.job_title || 'Document'}.pdf`);
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      window.print();
    }
  };
  
  // Form State
  const initialFormState = {
    id: null,
    client: "", // client_id
    client_name: "", // company_name for display
    profile: "",
    qaList: [{ question: "" }] // Removed answer
  };
  const [formData, setFormData] = useState(initialFormState);

  // API Data State
  const [clientsList, setClientsList] = useState([]);
  const [profilesList, setProfilesList] = useState([]);

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/domestic/crm/clients-list', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setClientsList(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  // Fetch profiles when client changes
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!formData.client) {
        setProfilesList([]);
        return;
      }
      
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch(`/api/domestic/crm/requirements-by-client?client_id=${formData.client}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setProfilesList(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
    
    fetchProfiles();
  }, [formData.client]);

  // Fetch FAQs from API
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/domestic/crm/faq', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setFaqs(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- Handlers ---
  const handleOpenModal = (faq = null) => {
    if (faq) {
      // Convert API data to form data
      setFormData({
        id: faq.faq_id,
        client: faq.client_id,
        client_name: faq.client_name,
        profile: faq.req_id,
        qaList: faq.questions || []
      });
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleAddQuestion = () => {
    setFormData({ ...formData, qaList: [...formData.qaList, { question: "" }] });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQA = formData.qaList.filter((_, i) => i !== index);
    setFormData({ ...formData, qaList: updatedQA });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQA = [...formData.qaList];
    updatedQA[index][field] = value;
    setFormData({ ...formData, qaList: updatedQA });
  };

  const handleSave = async () => {
    if (!formData.client || !formData.profile || formData.qaList[0].question.trim() === "") {
      alert("Please fill in the Client, Profile, and at least one Question.");
      return;
    }

    setSavingFaq(true);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      if (!token) return;

      let response;
      if (isEditing) {
        // Update existing FAQ
        response = await fetch('/api/domestic/crm/faq', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            faq_id: formData.id,
            questions: formData.qaList
          })
        });
      } else {
        // Create new FAQ
        response = await fetch('/api/domestic/crm/faq', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: formData.client,
            req_id: formData.profile,
            questions: formData.qaList
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        // Refresh FAQs list
        const faqsResponse = await fetch('/api/domestic/crm/faq', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const faqsData = await faqsResponse.json();
        if (faqsData.success) {
          setFaqs(faqsData.data || []);
        }
        handleCloseModal();
      } else {
        alert('Failed to save FAQ: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error saving FAQ');
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDelete = async (faq_id) => {
    if(!confirm("Are you sure you want to delete this FAQ set?")) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      if (!token) return;

      const response = await fetch(`/api/domestic/crm/faq/${faq_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(faqs.filter(f => f.faq_id !== faq_id));
      } else {
        alert('Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Error deleting FAQ');
    }
  };

  return (
    <div className="p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col relative print:bg-white print:p-0">
      
      {/* Hide the main dashboard when printing */}
      <div className={`max-w-7xl mx-auto w-full space-y-4 ${pdfFAQ ? 'print:hidden' : ''}`}>
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <HelpCircle size={20}/> Interview FAQ Repository
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Manage Client-Specific Interview Questions</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 focus-within:border-blue-400 transition-colors flex-1 sm:w-64">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" placeholder="Search Client or Profile..." 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => handleOpenModal()} 
                className="bg-[#103c7f] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Add FAQ
              </button>
            </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]"> 
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="sticky top-0 z-20 shadow-sm bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200">Client Name</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200">Profile / Role</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200 text-center">No. of Questions</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {faqs
                          .filter(f => (f.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (f.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((faq) => (
                            <tr key={faq.faq_id} className="hover:bg-slate-50 transition-colors align-middle group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-[#103c7f]" />
                                        <span className="font-black text-[#103c7f] text-sm">{faq.client_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-orange-500" />
                                        <span className="font-bold text-slate-700">{faq.job_title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-black w-6 h-6 rounded-full border border-blue-100">
                                        {faq.questions?.length || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(faq)}
                                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors" title="Edit FAQ"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(faq.faq_id)}
                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors" title="Delete FAQ"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setPdfFAQ(faq)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md transition-colors text-[10px] font-black uppercase tracking-widest ml-2" title="View PDF"
                                        >
                                            <FileText size={12} /> View PDF
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {faqs.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                                    <AlertCircle size={24} /> No FAQs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Modal Header */}
                <div className="bg-[#103c7f] text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        {isEditing ? <Edit size={18} /> : <Plus size={18} />} 
                        {isEditing ? "Edit FAQ Set" : "Add New FAQ Set"}
                    </h2>
                    <button onClick={handleCloseModal} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                    
                    {/* Top Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Client</label>
                            <select 
                                className="bg-gray-100 border border-gray-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#103c7f] shadow-sm"
                                value={formData.client} onChange={(e) => {
                                  const selectedClient = (clientsList || []).find(c => c.client_id === e.target.value);
                                  setFormData({...formData, client: e.target.value, client_name: selectedClient?.company_name || ''});
                                }}
                                disabled={isEditing}
                            >
                                <option value="" disabled>-- Select Client --</option>
                                {(clientsList || []).map(c => <option key={c.client_id} value={c.client_id}>{c.company_name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Profile / Role</label>
                            <select 
                                className="bg-gray-100 border border-gray-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#103c7f] shadow-sm"
                                value={formData.profile} onChange={(e) => setFormData({...formData, profile: e.target.value})}
                                disabled={isEditing || !formData.client}
                            >
                                <option value="" disabled>{!formData.client ? '-- Select Client First --' : '-- Select Profile --'}</option>
                                {(profilesList || []).map(p => <option key={p.req_id} value={p.req_id}>{p.job_title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 mb-6"></div>

                    {/* Question List */}
                    <div className="space-y-4">
                        {(formData.qaList || []).map((qa, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                <div className="absolute top-4 right-4">
                                    {formData.qaList.length > 1 && (
                                        <button 
                                            onClick={() => handleRemoveQuestion(index)}
                                            className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                            title="Remove Question"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <MessageSquare size={14}/> Question {index + 1}
                                </h4>
                                
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <input 
                                            type="text" placeholder="e.g. What are the key responsibilities?" 
                                            className="bg-gray-50 border border-gray-200 text-sm font-semibold text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-[#103c7f] focus:bg-white transition-all"
                                            value={qa.question} onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add More Button */}
                        <button 
                            onClick={handleAddQuestion}
                            className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add Another Question
                        </button>

                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={handleCloseModal}
                        className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={savingFaq}
                        className="px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#103c7f] hover:bg-blue-900 text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {savingFaq ? 'Saving...' : 'Save FAQ'}
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* --- PDF PREVIEW / PRINT MODAL --- */}
      {pdfFAQ && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:p-0 print:block">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] print:max-h-none h-full print:h-auto rounded-xl shadow-2xl flex flex-col print:shadow-none print:border-none animate-in zoom-in-95 duration-200">
                
                {/* Non-printable header controls */}
                <div className="bg-slate-100 p-4 flex justify-between items-center shrink-0 print:hidden border-b border-gray-200 rounded-t-xl">
                    <h2 className="font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={18}/> PDF Preview Mode
                    </h2>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleDownloadPdf} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                        >
                            <Download size={14}/> Download PDF
                        </button>
                        {/* <button 
                            onClick={() => window.print()} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                        >
                            <Printer size={14}/> Print
                        </button> */}
                        <button 
                            onClick={() => setPdfFAQ(null)} 
                            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                </div>

                {/* Printable A4 Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 bg-gray-200 print:bg-white custom-scrollbar">
                    <div id="faq-pdf-content" ref={pdfRef} className="bg-white max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none p-10 md:p-14 border border-gray-200 print:border-none">
                        
                        {/* Document Header & Logo */}
                        <div className="flex justify-between items-start border-b-2 border-[#103c7f] pb-6 mb-8">
                            <div className="flex items-center gap-2">
                               <img 
                                    src="/maven-logo.png" // Apne logo ka exact path yahan dalein
                                    alt="Maven Logo" 
                                    className="h-12 object-contain print:h-12"
                                />
                            </div>
                            <div className="text-right">
                                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">FAQ </h1>
                            </div>
                        </div>

                        {/* Client Meta Info */}
                        <div className="bg-slate-50 border border-gray-200 p-5 rounded-xl mb-8 flex flex-col gap-3">
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-black text-gray-500 uppercase tracking-widest">Client Name:</span>
                                <span className="text-sm font-black text-[#103c7f]">{pdfFAQ.client_name}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-black text-gray-500 uppercase tracking-widest">Profile / Role:</span>
                                <span className="text-sm font-bold text-slate-700">{pdfFAQ.job_title}</span>
                            </div>
                        </div>

                        {/* Questions Content */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Question Bank</h3>
                            {(pdfFAQ.questions || []).map((qa, index) => (
                                <div key={index} className="break-inside-avoid">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-start gap-2 mb-2 leading-snug">
                                        <span className="text-[#103c7f] font-black shrink-0">Q{index + 1}.</span> {qa.question}
                                    </h3>
                                </div>
                            ))}
                        </div>
                        
                        {/* Footer */}
                        <div className="mt-20 pt-6 border-t border-gray-200 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Confidential Document - Maven Jobs
                        </div>

                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}