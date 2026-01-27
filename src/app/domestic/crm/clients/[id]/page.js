
"use client";
import { useState } from "react";
import Link from "next/link";
import { 
  Building2, MapPin, Phone, Mail, User, 
  FileText, Plus, ChevronRight, ArrowLeft,
  MessageSquare, Link as LinkIcon, Clock,
  Briefcase, CheckCircle, Edit, Share2, 
  Calendar, CreditCard, Layout, ShieldCheck,
  ImageIcon, ExternalLink, X, Save, Eye, Lock,
  PlusCircle
} from "lucide-react";

export default function ClientMasterProfile() {
  
  // --- STATE FOR MODALS ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isAllContactsOpen, setIsAllContactsOpen] = useState(false);
  const [isAllReqsOpen, setIsAllReqsOpen] = useState(false);

  // --- 1. MASTER CLIENT DATA ---
  const [clientData, setClientData] = useState({
    id: 101,
    name: "Nexus Retail Group",
    onboardedOn: "2024-01-18",
    clientType: "A", // CHANGED: Just 'A', 'B', or 'C'
    industry: "Retail / FMCG",
    hqLocation: "Gurgaon, Haryana",
    gst: "07AAACN1234F1Z5",
    kycStatus: "Pending", 
    contractLink: "https://example.com/contract.pdf", 
    termsCondition: "Standard Net-30 Payment Terms. Invoice generation on 1st of every month.",
    kycDocLink: "",
    emailScreenshot: "",
    status: "Active",
    branches: [
      { id: 'b1', name: "Gurgaon HQ", state: "Haryana", type: "Corporate" },
      { id: 'b2', name: "Noida Warehouse", state: "Uttar Pradesh", type: "Warehouse" },
      { id: 'b3', name: "Mumbai Regional", state: "Maharashtra", type: "Regional" },
    ]
  });

  // --- FORM STATE ---
  const [formData, setFormData] = useState(clientData);
  const [selectedBranchId, setSelectedBranchId] = useState('b1');
  
  // --- MOCK BRANCH DETAILS ---
 // --- MOCK BRANCH DETAILS (With Scrollable History Data) ---
 // --- MOCK BRANCH DETAILS (Updated with Contact Names in Logs) ---
  const [branchDetails, setBranchDetails] = useState({
    'b1': {
      address: "DLF Cyber City, Phase 3, Gurgaon",
      contacts: [
        { id: 'c1', name: "Mr. Vikram Singh", role: "HR Director", phone: "+91 98765 43210", email: "vikram@nexus.com" },
        { id: 'c2', name: "Ms. Sneha", role: "Talent Acq.", phone: "+91 99887 76655", email: "sneha@nexus.com" }
      ],
      requirements: [
        { id: 'r1', title: "Senior Data Analyst", openPositions: 2, status: "Active", pocId: 'c1' },
      ],
      trackers: [ { id: 't1', name: "Data Analyst Tracker", url: "#", lastUpdated: "2 mins ago" } ],
      logs: [
        { id: 1, contact: "Mr. Vikram Singh", date: "Today, 10:30 AM", type: "Call", msg: "Spoke regarding the new requirement. He emphasized needing candidates with immediate joining availability.", author: "You" },
        { id: 2, contact: "Ms. Sneha", date: "Yesterday, 4:15 PM", type: "Email", msg: "Shared the first batch of 5 candidate profiles for the Data Analyst role. Waiting for feedback.", author: "You" },
        { id: 3, contact: "Ms. Sneha", date: "Jan 19, 11:00 AM", type: "Whatsapp", msg: "Confirmed receipt of the profiles. She said she will schedule interviews by Friday.", author: "You" },
        { id: 4, contact: "HR Team", date: "Jan 18, 02:30 PM", type: "Call", msg: "Introductory call with the new HR team. Discussed the commercial terms and signed the agreement.", author: "You" },
        { id: 5, contact: "Mr. Vikram Singh", date: "Jan 15, 09:45 AM", type: "Email", msg: "Sent the revised commercial proposal based on the negotiation call.", author: "You" },
        { id: 6, contact: "Legal Team", date: "Jan 12, 05:00 PM", type: "Call", msg: "Follow-up on the contract status. Legal team is reviewing the document.", author: "You" },
        { id: 7, contact: "Accounts Dept", date: "Jan 10, 01:20 PM", type: "Email", msg: "Requested KYC documents to proceed with vendor registration.", author: "You" },
        { id: 8, contact: "Mr. Vikram Singh", date: "Jan 08, 10:00 AM", type: "Call", msg: "Cold call to Vikram. He expressed interest in our bulk hiring services.", author: "You" },
        { id: 9, contact: "Info Desk", date: "Jan 05, 03:00 PM", type: "Email", msg: "Sent company capability deck and client case studies.", author: "You" },
        { id: 10, contact: "Reception", date: "Jan 02, 11:30 AM", type: "Call", msg: "Initial outreach. Left a voicemail.", author: "You" }
      ]
    },
    'b2': { address: "Sector 63, Noida", contacts: [], requirements: [], trackers: [], logs: [] },
    'b3': { address: "BKC, Mumbai", contacts: [], requirements: [], trackers: [], logs: [] }
  });
  // --- STATE FOR ADD BRANCH MODAL ---
 const [newBranchData, setNewBranchData] = useState({
    name: '',
    state: '',
    city: '',      // Added City
    address: '',   // Added Address
    status: 'Active' // Added Status (Default Active)
  });

  const [newContactData, setNewContactData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    isPrimary: 'No',
    roleDescription: ''
  });
   
const [newConversationData, setNewConversationData] = useState({
    contactId: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    mode: '',
    discussion: '',
    nextFollowUp: ''
  });

  const [newReqData, setNewReqData] = useState({
    jobTitle: '',
    jdLink: '',
    experience: '',
    package: '',
    openings: '',
    priority: '',
   status: 'Not Started', // <--- UPDATED DEFAULT VALUE
    timeline: '',
    receivedDate: new Date().toISOString().split('T')[0]
  });
  const [newTrackerData, setNewTrackerData] = useState({
    reqId: '',
    shareDate: new Date().toISOString().split('T')[0],
    sharedCount: '',
    interviewed: '',
    selected: '',
    joining: '',
    rejected: '',
    feedback: ''
  });


  // --- HANDLER TO SAVE BRANCH ---
  const handleSaveBranch = () => {
    const newId = `b${clientData.branches.length + 1}`;
    const newBranch = {
      id: newId,
      name: newBranchData.name,
      state: newBranchData.state,
      type: "Branch", // Keeping generic type or you can add a dropdown if needed
      status: newBranchData.status // Store status
    };
    setClientData(prev => ({
      ...prev,
      branches: [...prev.branches, newBranch]
    }));
    setBranchDetails(prev => ({
      ...prev,
      [newId]: {
        address: newBranchData.location,
        contacts: [],
        requirements: [],
        trackers: [],
        logs: []
      }
    }));
    setIsBranchModalOpen(false);
    setNewBranchData({ name: '', state: '', city: '', address: '', status: 'Active' }); // Reset
  };

  const handleSaveConversation = () => {
    // Mock logic to save conversation
    console.log("Saving Conversation:", newConversationData);
    
    // Here you would typically update the 'logs' state or make an API call
    // For now, we just close the modal and reset
    setIsConversationModalOpen(false);
    setNewConversationData({
      contactId: '',
      date: new Date().toISOString().split('T')[0],
      mode: '',
      discussion: '',
      nextFollowUp: ''
    });
  };
  
  const currentBranchData = branchDetails[selectedBranchId] || { contacts: [], requirements: [], logs: [], trackers: [] };

  // --- HANDLERS ---
  const openEditModal = () => { setFormData(clientData); setIsEditModalOpen(true); };
  const handleSaveFundamentals = () => { setClientData(formData); setIsEditModalOpen(false); };
  const handleSaveContact = () => {
    // Mock logic to save contact
    console.log("Saving Contact:", newContactData);
    setIsContactModalOpen(false);
    // Reset form
    setNewContactData({ name: '', email: '', phone: '', designation: '', department: '', isPrimary: 'No', roleDescription: '' });
  };
    const handleSaveTracker = () => {
    console.log("Saving Tracker Stats:", newTrackerData);
    setIsTrackerModalOpen(false);
    // Reset form
    setNewTrackerData({
      reqId: '', shareDate: new Date().toISOString().split('T')[0],
      sharedCount: '', interviewed: '', selected: '', joining: '', rejected: '', feedback: ''
    });
  };
   const handleSaveRequirement = () => {
    console.log("Saving Requirement:", newReqData);
    setIsReqModalOpen(false);
    // Reset form
    setNewReqData({
      jobTitle: '', jdLink: '', experience: '', package: '', 
      openings: '', priority: '', status: 'Open', timeline: '', 
      assignedTo: '', receivedDate: new Date().toISOString().split('T')[0]
    });
  };

return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden">
      
      {/* ================= COLUMN 1: FUNDAMENTALS + BRANCHES (Fixed Width) ================= */}
      <div className="w-[320px] flex flex-col border-r border-gray-200 bg-white shrink-0 z-20 shadow-xl">
        
        {/* PART A: FUNDAMENTALS (Top Card) - Now Vertical */}
        <div className="bg-[#103c7f] text-white p-5 shrink-0 flex flex-col gap-4 relative overflow-hidden">
           
           {/* Back Link */}
           <Link href="/domestic/crm/onboard" className="flex items-center gap-1 text-[10px] text-blue-200 hover:text-white transition-colors font-bold w-fit">
             <ArrowLeft size={10} /> Back to Queue
           </Link>

           {/* Identity */}
           <div>
              <div className="flex justify-between items-start">
                
                 <span className="text-[10px] font-mono opacity-60">#{clientData.id}</span>
              </div>
              
              <h1 className="text-xl font-black tracking-tight leading-tight">{clientData.name}</h1>
              
              <div className="flex flex-wrap gap-2 mt-2">
                 <span className="text-[9px] bg-blue-500/30 text-blue-100 border border-blue-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                   {clientData.industry}
                 </span>
                 <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-yellow-500 text-yellow-900 border border-yellow-400 rounded-full font-black shadow-sm" title="Category">
                   {clientData.clientType}
                 </span>
              </div>

              <div className="mt-3 space-y-1">
                 <p className="flex items-center gap-2 text-[11px] text-blue-100 font-medium">
                    <MapPin size={11} className="opacity-70"/> {clientData.hqLocation}
                 </p>
                 <p className="flex items-center gap-2 text-[11px] text-blue-100 font-medium">
                    <Calendar size={11} className="opacity-70"/> Since: {clientData.onboardedOn}
                 </p>
              </div>
           </div>

           {/* Action Buttons (Compact Grid) */}
           <div className="grid grid-cols-2 gap-2 mt-1">
              <button onClick={() => setIsComplianceModalOpen(true)} className="flex items-center justify-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg border border-white/10 transition-all font-bold">
                 <ShieldCheck size={12} /> Compliance
              </button>
              <button onClick={openEditModal} className="flex items-center justify-center gap-1 text-[10px] bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg shadow-md transition-all active:scale-95 font-bold border border-orange-400">
                 <Edit size={12} /> Edit Profile
              </button>
           </div>
        </div>

        {/* PART B: BRANCH NAVIGATION (Bottom List - Scrollable) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
           <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
              <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                 <Building2 size={14}/> Branch Network
              </h3>
              <button onClick={() => setIsBranchModalOpen(true)} className="text-white bg-[#103c7f] hover:bg-blue-900 p-1 rounded transition-colors tooltip shadow-sm" title="Add Branch">
                 <Plus size={14} />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {clientData.branches.map((branch) => (
                <button 
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group relative ${
                    selectedBranchId === branch.id 
                    ? "bg-white border-[#103c7f] shadow-md ring-1 ring-blue-50" 
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  {selectedBranchId === branch.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#103c7f] rounded-l-xl"></div>}
                  <div className="flex justify-between items-center pl-1">
                    <span className={`text-xs font-bold ${selectedBranchId === branch.id ? "text-[#103c7f]" : "text-gray-700"}`}>
                      {branch.name}
                    </span>
                    {selectedBranchId === branch.id && <ChevronRight size={14} className="text-[#103c7f]" />}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 pl-1">
                    <MapPin size={10} /> {branch.state}
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>

     {/* ================= COLUMN 2: CONVERSATION HUB ================= */}
      <div className="flex-[1.6] bg-white border-r border-gray-200 flex flex-col min-w-[400px] shadow-[4px_0_24px_rgba(0,0,0,0.08)] z-20 relative">
         
         {/* HEADER: Orange Theme, Exact Height & Padding */}
         <div className="h-16 px-6 py-4 border-b border-orange-100 bg-orange-50/40 flex justify-between items-center shrink-0 border-t-4 border-t-orange-400 z-10">
            <div>
               <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-orange-500"/> Conversation Tab
               </h3>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsContactModalOpen(true)} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 shadow-sm transition-all hover:border-orange-200 hover:text-orange-600">
                  <Plus size={12}/> Contact
               </button>
               <button 
                  onClick={() => setIsConversationModalOpen(true)} 
                  className="flex items-center gap-1 bg-[#103c7f] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-900 shadow-md transition-all"
               >
                  <Plus size={12}/> Conversation
               </button>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* 1. Activity Timeline */}
            <div className="flex-1 flex flex-col min-h-0">
               <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Conversation History</label>
                  <button onClick={() => setIsAllContactsOpen(true)} className="text-[10px] font-bold text-[#103c7f] hover:underline flex items-center gap-1">
                     View All Contact <ChevronRight size={10} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"> 
                  <div className="space-y-4 pb-10">
                     {currentBranchData.logs.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                           <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              log.type === 'Call' ? 'bg-green-500' : log.type === 'Email' ? 'bg-blue-500' : 'bg-gray-400'
                           }`}></div>
                           <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50 pl-2">
                              <div className="flex items-center gap-2">
                                 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    log.type === 'Call' ? 'bg-green-50 text-green-700' :
                                    log.type === 'Email' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                                 }`}>
                                    {log.type}
                                 </span>
                                 <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                    <User size={10} className="text-gray-400"/> {log.contact}
                                 </span>
                                 <span className="text-[10px] font-medium text-gray-400 border-l border-gray-200 pl-2 ml-1">
                                    {log.date}
                                 </span>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                 <span className="text-[9px] text-gray-400 uppercase font-bold">Next Follow-up</span>
                                 <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Jan 25</span>
                              </div>
                           </div>
                           <p className="text-xs text-gray-700 font-medium leading-relaxed pl-2">
                              {log.msg}
                           </p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   
{/* ================= COLUMN 3: OPERATIONS HUB (1 Flex) ================= */}
     {/* ================= COLUMN 3: OPERATIONS HUB ================= */}
      <div className="flex-1 bg-slate-50 flex flex-col min-w-[350px]">
         
         {/* HEADER: Blue Theme, Exact Height & Padding to match Column 2 */}
         <div className="h-16 px-6 py-4 border-b border-blue-100 bg-blue-50/40 flex justify-between items-center shrink-0 border-t-4 border-t-[#103c7f]">
            <div>
               <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={16} className="text-[#103c7f]"/> Operations Tab
               </h3>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={() => setIsTrackerModalOpen(true)} 
                  className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600"
               >
                  <Plus size={12}/> Tracker
               </button>
               <button 
                  onClick={() => setIsReqModalOpen(true)} 
                  className="flex items-center gap-1 bg-[#103c7f] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-900 shadow-md transition-all"
               >
                  <Plus size={12}/> Req
               </button>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
            <section className="flex-1 flex flex-col min-h-0">
               <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tracker History</label>
                  <button onClick={() => setIsAllReqsOpen(true)} className="text-[10px] font-bold text-[#103c7f] hover:underline flex items-center gap-1">
                     View All Requirement <ChevronRight size={10} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[500px]">
                  <div className="grid grid-cols-1 gap-4 pb-10">
                     {[
                        { id: 't1', name: 'Senior Data Analyst', date: 'Jan 18, 2024', s: 12, i: 8, sel: 3, j: 2, r: 4, feedback: "Good candidates, looking for faster joiners..." },
                        { id: 't2', name: 'Java Backend Developer', date: 'Jan 15, 2024', s: 20, i: 5, sel: 1, j: 0, r: 14, feedback: "Technical skills need improvement." },
                        { id: 't3', name: 'Frontend React Lead', date: 'Jan 10, 2024', s: 15, i: 4, sel: 2, j: 1, r: 8, feedback: "Profile shortlisted, scheduling interviews." },
                        { id: 't4', name: 'DevOps Engineer', date: 'Jan 05, 2024', s: 8, i: 6, sel: 2, j: 2, r: 2, feedback: "Excellent coordination. Closed quickly." },
                        { id: 't5', name: 'Python Developer', date: 'Jan 02, 2024', s: 25, i: 10, sel: 4, j: 3, r: 12, feedback: "Keep sending profiles with Django exp." }
                     ].map((t) => (
                        <div key={t.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all">
                           {/* Compact Header: Title Left, Date Right */}
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                              <div className="flex-1 min-w-0 pr-2"> {/* Added flex-1 for truncation safety */}
                                 <h5 className="text-xs font-black text-gray-800 truncate">{t.name}</h5>
                              </div>
                              <div className="shrink-0">
                                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mr-1">Shared:</span>
                                 <span className="text-[10px] text-gray-600 font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded">{t.date}</span>
                              </div>
                           </div>
                           <div className="flex items-center justify-between px-2 py-4 bg-white">
                              <div className="flex-1 text-center border-r border-gray-100 last:border-0 px-1">
                                 <p className="text-[13px] font-black text-gray-800">{t.s}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wide">Shared</p>
                              </div>
                              <div className="flex-1 text-center border-r border-gray-100 last:border-0 px-1">
                                 <p className="text-[13px] font-black text-blue-600">{t.i}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wide">Interview</p>
                              </div>
                              <div className="flex-1 text-center border-r border-gray-100 last:border-0 px-1">
                                 <p className="text-[13px] font-black text-orange-500">{t.sel}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wide">Selected</p>
                              </div>
                              <div className="flex-1 text-center border-r border-gray-100 last:border-0 px-1">
                                 <p className="text-[13px] font-black text-green-600">{t.j}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wide">Joined</p>
                              </div>
                              <div className="flex-1 text-center px-1">
                                 <p className="text-[13px] font-black text-red-500">{t.r}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wide">Not Selected</p>
                              </div>
                           </div>
                           <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
                              <div className="flex items-center gap-2 overflow-hidden">
                                 <span className="text-[9px] font-bold text-gray-400 uppercase shrink-0">Feedback:</span>
                                 <p className="text-[10px] text-gray-600 font-medium italic truncate max-w-[150px]">"{t.feedback}"</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
         </div>
      </div>
      {/* ================= MODALS SECTION ================= */}
      
      {/* 1. COMPLIANCE MODAL */}
     {isComplianceModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
              
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#103c7f]"/> Compliance Data
                 </h3>
                 <button onClick={() => setIsComplianceModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
              </div>

              <div className="p-5 space-y-5">
                 
                 {/* Status Row */}
                 <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">KYC Status</p>
                       <span className={`text-sm font-black ${clientData.kycStatus === 'Verified' ? 'text-green-600' : 'text-orange-500'}`}>
                          {clientData.kycStatus}
                       </span>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">GST Number</p>
                       <span className="text-sm font-mono font-bold text-[#103c7f]">{clientData.gst}</span>
                    </div>
                 </div>

                 {/* T&C Box */}
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Terms & Conditions</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 leading-relaxed font-medium">
                       {clientData.termsCondition || "No specific terms added."}
                    </div>
                 </div>

                 {/* Documents Links */}
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Attached Documents</label>
                    <div className="grid grid-cols-2 gap-3">
                       
                       {/* Contract */}
                       <a href={clientData.contractLink || "#"} target="_blank" className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${clientData.contractLink ? 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer group' : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'}`}>
                          <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><FileText size={14}/></div>
                          <div>
                             <p className="text-xs font-bold text-gray-700">Contract</p>
                             <p className="text-[9px] text-gray-400">{clientData.contractLink ? "View PDF" : "Not Uploaded"}</p>
                          </div>
                       </a>

                       {/* KYC Doc */}
                       <a href={clientData.kycDocLink || "#"} target="_blank" className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${clientData.kycDocLink ? 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer group' : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'}`}>
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><LinkIcon size={14}/></div>
                          <div>
                             <p className="text-xs font-bold text-gray-700">KYC Doc</p>
                             <p className="text-[9px] text-gray-400">{clientData.kycDocLink ? "Download" : "Not Uploaded"}</p>
                          </div>
                       </a>

                       {/* Email Proof */}
                       <a href={clientData.emailScreenshot || "#"} target="_blank" className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${clientData.emailScreenshot ? 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer group' : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'}`}>
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"><ImageIcon size={14}/></div>
                          <div>
                             <p className="text-xs font-bold text-gray-700">Email Proof</p>
                             <p className="text-[9px] text-gray-400">{clientData.emailScreenshot ? "View Image" : "Not Uploaded"}</p>
                          </div>
                       </a>

                    </div>
                 </div>

              </div>
              <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                 <button onClick={() => { setIsComplianceModalOpen(false); openEditModal(); }} className="text-[10px] font-bold text-blue-600 hover:underline">
                    Need to update this? Click to Edit
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 2. EDIT MODAL */}
        {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Edit Client Fundamentals</h3>
                        <p className="text-xs text-blue-200 opacity-80">Update Sales Data & Add CRM Fulfillment Details</p>
                    </div>
                    <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Modal Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* LEFT COLUMN: FUNDAMENTAL DETAILS (Editable Sales Data) */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                                <User size={16} className="text-[#103c7f]"/>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Client Fundamentals</h4>
                            </div>
                            
                            {/* Client Name */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Client Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    className="w-full border border-gray-300 rounded p-2.5 text-sm font-bold text-[#103c7f] focus:border-[#103c7f] outline-none bg-blue-50/30" 
                                />
                            </div>

                            {/* Date & HQ Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Onboard Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.onboardedOn} 
                                        onChange={(e) => setFormData({...formData, onboardedOn: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">HQ Location</label>
                                    <input 
                                        type="text" 
                                        value={formData.hqLocation} 
                                        onChange={(e) => setFormData({...formData, hqLocation: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none" 
                                    />
                                </div>
                            </div>

                            {/* Client Type & Category Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Client Type</label>
                                    <select 
                                        value={formData.clientType} 
                                        onChange={(e) => setFormData({...formData, clientType: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                                    >
                                        <option>Category A</option>
                                        <option>Category B</option>
                                        <option>Category C</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Industry Category</label>
                                    <input 
                                        type="text" 
                                        value={formData.industry} 
                                        onChange={(e) => setFormData({...formData, industry: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CRM FULFILLMENT (New Fields) */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                                <ShieldCheck size={16} className="text-orange-500"/>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Compliance & Docs</h4>
                            </div>

                            {/* KYC Status & GST */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">KYC Status</label>
                                    <select 
                                        value={formData.kycStatus} 
                                        onChange={(e) => setFormData({...formData, kycStatus: e.target.value})} 
                                        className={`w-full border rounded p-2.5 text-sm font-bold outline-none ${
                                            formData.kycStatus === 'Done' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-300'
                                        }`}
                                    >
                                        <option>Not Started</option>
                                        <option>In Progress</option>
                                        <option>Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">GST Details</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter GSTIN"
                                        value={formData.gst} 
                                        onChange={(e) => setFormData({...formData, gst: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm font-mono focus:border-[#103c7f] outline-none" 
                                    />
                                </div>
                            </div>

                            {/* Contract Link */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Contract Link (Drive/PDF)</label>
                                <div className="flex gap-2">
                                    <div className="bg-gray-100 p-2.5 rounded border border-gray-200 text-gray-500"><LinkIcon size={16}/></div>
                                    <input 
                                        type="text" 
                                        placeholder="Paste URL here..." 
                                        value={formData.contractLink} 
                                        onChange={(e) => setFormData({...formData, contractLink: e.target.value})} 
                                        className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none text-blue-600 underline" 
                                    />
                                </div>
                            </div>

                            {/* Terms & Conditions Box */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Terms & Conditions</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Enter payment terms, SLA notes..." 
                                    value={formData.termsCondition} 
                                    onChange={(e) => setFormData({...formData, termsCondition: e.target.value})} 
                                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                                ></textarea>
                            </div>

                            {/* Upload Buttons (Simulated) */}
                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">KYC Document</label>
                                    <button className="w-full border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#103c7f] p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                                        <FileText size={14}/> Upload Doc
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Email Screenshot</label>
                                    <button className="w-full border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#103c7f] p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                                        <ImageIcon size={14}/> Upload Image
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveFundamentals} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transform active:scale-95 transition-all">
                        <Save size={18}/> Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. ADD BRANCH MODAL */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Add New Branch</h3>
                        <p className="text-xs text-blue-200 opacity-80">Expand client presence to a new location.</p>
                    </div>
                    <button onClick={() => setIsBranchModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    
                    {/* Branch Name */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Branch Name <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g. Pune Regional Office"
                          value={newBranchData.name}
                          onChange={(e) => setNewBranchData({...newBranchData, name: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2.5 text-sm font-bold text-[#103c7f] focus:border-[#103c7f] outline-none"
                        />
                    </div>

                    {/* Country & State Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Country (Read Only) */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Country</label>
                            <div className="flex items-center gap-2 w-full border border-gray-200 bg-gray-100 rounded p-2.5 text-sm font-bold text-gray-500 cursor-not-allowed">
                                <span className="text-lg leading-none">🇮🇳</span> India
                            </div>
                        </div>

                        {/* State Dropdown */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">State</label>
                            <select 
                              value={newBranchData.state}
                              onChange={(e) => setNewBranchData({...newBranchData, state: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none custom-scrollbar"
                            >
                                <option value="">Select State...</option>
                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                <option value="Assam">Assam</option>
                                <option value="Bihar">Bihar</option>
                                <option value="Chhattisgarh">Chhattisgarh</option>
                                <option value="Goa">Goa</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Haryana">Haryana</option>
                                <option value="Himachal Pradesh">Himachal Pradesh</option>
                                <option value="Jharkhand">Jharkhand</option>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Kerala">Kerala</option>
                                <option value="Madhya Pradesh">Madhya Pradesh</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Manipur">Manipur</option>
                                <option value="Meghalaya">Meghalaya</option>
                                <option value="Mizoram">Mizoram</option>
                                <option value="Nagaland">Nagaland</option>
                                <option value="Odisha">Odisha</option>
                                <option value="Punjab">Punjab</option>
                                <option value="Rajasthan">Rajasthan</option>
                                <option value="Sikkim">Sikkim</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Telangana">Telangana</option>
                                <option value="Tripura">Tripura</option>
                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                                <option value="Uttarakhand">Uttarakhand</option>
                                <option value="West Bengal">West Bengal</option>
                                <option disabled>──────────</option>
                                <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                                <option value="Chandigarh">Chandigarh</option>
                                <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra & Nagar Haveli</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                <option value="Ladakh">Ladakh</option>
                                <option value="Lakshadweep">Lakshadweep</option>
                                <option value="Puducherry">Puducherry</option>
                            </select>
                        </div>
                    </div>

                    {/* City & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Pune"
                              value={newBranchData.city}
                              onChange={(e) => setNewBranchData({...newBranchData, city: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Initial Status</label>
                            <select 
                              value={newBranchData.status}
                              onChange={(e) => setNewBranchData({...newBranchData, status: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Setup in Progress">Setup in Progress</option>
                            </select>
                        </div>
                    </div>

                    {/* Address Field */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Full Address / Landmark</label>
                        <textarea 
                          rows="2"
                          placeholder="e.g. Plot No 45, Phase 2, Industrial Area..."
                          value={newBranchData.address}
                          onChange={(e) => setNewBranchData({...newBranchData, address: e.target.value})}
                          className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsBranchModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveBranch} className="bg-[#103c7f] hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
                        <Plus size={16}/> Create Branch
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* ================= MODAL 4: ADD NEW CONTACT ================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Add New Contact</h3>
                        <p className="text-xs text-blue-200 opacity-80">Add a new point of contact for this branch.</p>
                    </div>
                    <button onClick={() => setIsContactModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5">
                    
                    {/* Row 1: Name & Email */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Name</label>
                            <input 
                              type="text" 
                              value={newContactData.name}
                              onChange={(e) => setNewContactData({...newContactData, name: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                            <input 
                              type="email" 
                              value={newContactData.email}
                              onChange={(e) => setNewContactData({...newContactData, email: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 2: Phone & Designation */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Phone</label>
                            <input 
                              type="text" 
                              value={newContactData.phone}
                              onChange={(e) => setNewContactData({...newContactData, phone: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Designation</label>
                            <input 
                              type="text" 
                              value={newContactData.designation}
                              onChange={(e) => setNewContactData({...newContactData, designation: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 3: Department & Primary Contact */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Department</label>
                            <input 
                              type="text" 
                              value={newContactData.department}
                              onChange={(e) => setNewContactData({...newContactData, department: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Primary Contact?</label>
                            <select 
                              value={newContactData.isPrimary}
                              onChange={(e) => setNewContactData({...newContactData, isPrimary: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            >
                                <option>Select</option>
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Handles */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">What they handle?</label>
                        <textarea 
                          rows="2"
                          value={newContactData.roleDescription}
                          onChange={(e) => setNewContactData({...newContactData, roleDescription: e.target.value})}
                          className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsContactModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveContact} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                        <User size={16}/> Save Contact
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ================= MODAL 5: ADD CONVERSATION ================= */}
      {isConversationModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Add Conversation</h3>
                        <p className="text-xs text-blue-200 opacity-80">Log a new interaction with the client.</p>
                    </div>
                    <button onClick={() => setIsConversationModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5">
                    
                    {/* Contact Name Dropdown */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Name</label>
                        <select 
                          value={newConversationData.contactId}
                          onChange={(e) => setNewConversationData({...newConversationData, contactId: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                        >
                            <option value="">Select Contact</option>
                            {/* Dynamically listing contacts from current branch data */}
                            {currentBranchData.contacts.map(contact => (
                                <option key={contact.id} value={contact.id}>{contact.name} ({contact.role})</option>
                            ))}
                        </select>
                    </div>

                    {/* Row: Date & Mode */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
                            <input 
                              type="date" 
                              value={newConversationData.date}
                              onChange={(e) => setNewConversationData({...newConversationData, date: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Mode</label>
                            <select 
                              value={newConversationData.mode}
                              onChange={(e) => setNewConversationData({...newConversationData, mode: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            >
                                <option value="">Select</option>
                                <option value="Call">Call</option>
                                <option value="Email">Email</option>
                                <option value="Whatsapp">Whatsapp</option>
                                <option value="Visit">Visit</option>
                                <option value="Video Call">Video Call</option>
                            </select>
                        </div>
                    </div>

                    {/* Discussion Text Area */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Discussion</label>
                        <textarea 
                          rows="4"
                          value={newConversationData.discussion}
                          onChange={(e) => setNewConversationData({...newConversationData, discussion: e.target.value})}
                          className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                          placeholder="Enter details of the conversation..."
                        ></textarea>
                    </div>

                    {/* Next Follow-up Date */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Next Follow-up Date</label>
                        <input 
                          type="date" 
                          value={newConversationData.nextFollowUp}
                          onChange={(e) => setNewConversationData({...newConversationData, nextFollowUp: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsConversationModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveConversation} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                        <MessageSquare size={16}/> Save Conversation
                    </button>
                </div>
            </div>
        </div>
      )}
      {/* ================= MODAL 6: ADD REQUIREMENT ================= */}
      {isReqModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Add Requirement</h3>
                        <p className="text-xs text-blue-200 opacity-80">Post a new job requirement for this client.</p>
                    </div>
                    <button onClick={() => setIsReqModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5">
                    
                    {/* Row 1: Job Title & JD Link */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Job Title</label>
                            <input 
                              type="text" 
                              value={newReqData.jobTitle}
                              onChange={(e) => setNewReqData({...newReqData, jobTitle: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">JD Link</label>
                            <input 
                              type="text" 
                              value={newReqData.jdLink}
                              onChange={(e) => setNewReqData({...newReqData, jdLink: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none text-blue-600 underline"
                              placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Row 2: Experience & Package */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Experience</label>
                            <input 
                              type="text" 
                              value={newReqData.experience}
                              onChange={(e) => setNewReqData({...newReqData, experience: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="e.g. 2-4 Years"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Package</label>
                            <input 
                              type="text" 
                              value={newReqData.package}
                              onChange={(e) => setNewReqData({...newReqData, package: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="e.g. 12 LPA"
                            />
                        </div>
                    </div>

                    {/* Row 3: Openings & Priority */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">No. of Openings</label>
                            <input 
                              type="number" 
                              value={newReqData.openings}
                              onChange={(e) => setNewReqData({...newReqData, openings: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Hiring Priority</label>
                            <select 
                              value={newReqData.priority}
                              onChange={(e) => setNewReqData({...newReqData, priority: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            >
                                <option value="">Select</option>
                                <option value="High">High 🔥</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Status & Timeline */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                            <select 
                              value={newReqData.status}
                              onChange={(e) => setNewReqData({...newReqData, status: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Timeline</label>
                            <input 
                              type="date" 
                              value={newReqData.timeline}
                              onChange={(e) => setNewReqData({...newReqData, timeline: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                    </div>

                    

                    {/* Row 6: Requirement Received Date */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Requirement Received Date</label>
                        <input 
                          type="date" 
                          value={newReqData.receivedDate}
                          onChange={(e) => setNewReqData({...newReqData, receivedDate: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsReqModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveRequirement} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                        <Briefcase size={16}/> Save Requirement
                    </button>
                </div>
            </div>
        </div>
      )}
      {/* ================= MODAL 7: ADD TRACKER DETAILS ================= */}
      {isTrackerModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Add Tracker Stats</h3>
                        <p className="text-xs text-blue-200 opacity-80">Update recruitment funnel numbers for a requirement.</p>
                    </div>
                    <button onClick={() => setIsTrackerModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5">
                    
                    {/* Requirement Selection Dropdown */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Requirement</label>
                        <select 
                          value={newTrackerData.reqId}
                          onChange={(e) => setNewTrackerData({...newTrackerData, reqId: e.target.value})}
                          className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                        >
                            <option value="">Select Requirement</option>
                            {/* Dynamically listing active requirements */}
                            {currentBranchData.requirements.map(req => (
                                <option key={req.id} value={req.id}>{req.title} (Openings: {req.openPositions})</option>
                            ))}
                        </select>
                    </div>

                    {/* Row 1: Share Date & Shared Count */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Tracker Share Date</label>
                            <input 
                              type="date" 
                              value={newTrackerData.shareDate}
                              onChange={(e) => setNewTrackerData({...newTrackerData, shareDate: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Tracker Shared (Count)</label>
                            <input 
                              type="number" 
                              value={newTrackerData.sharedCount}
                              onChange={(e) => setNewTrackerData({...newTrackerData, sharedCount: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Row 2: Interviewed & Selected */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Interviewed</label>
                            <input 
                              type="number" 
                              value={newTrackerData.interviewed}
                              onChange={(e) => setNewTrackerData({...newTrackerData, interviewed: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Selected</label>
                            <input 
                              type="number" 
                              value={newTrackerData.selected}
                              onChange={(e) => setNewTrackerData({...newTrackerData, selected: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Row 3: Joining & Rejected */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Joining</label>
                            <input 
                              type="number" 
                              value={newTrackerData.joining}
                              onChange={(e) => setNewTrackerData({...newTrackerData, joining: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Not Selected</label>
                            <input 
                              type="number" 
                              value={newTrackerData.rejected}
                              onChange={(e) => setNewTrackerData({...newTrackerData, rejected: e.target.value})}
                              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#103c7f] outline-none"
                              placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Feedback Text Area */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Feedback From Client</label>
                        <textarea 
                          rows="3"
                          value={newTrackerData.feedback}
                          onChange={(e) => setNewTrackerData({...newTrackerData, feedback: e.target.value})}
                          className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                          placeholder="Any specific feedback on profiles shared..."
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsTrackerModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 text-sm">Cancel</button>
                    <button onClick={handleSaveTracker} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                        <Share2 size={16}/> Save Tracker
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ================= MODAL 8: VIEW ALL CONTACTS (TABLE FORMAT) ================= */}
      {isAllContactsOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white shrink-0">
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-wide">All Points of Contact</h3>
                    <p className="text-xs text-blue-200 opacity-80">Comprehensive list of contacts across all branches.</p>
                 </div>
                 <button onClick={() => setIsAllContactsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                 <div className="space-y-8">
                    
                    {/* Loop through branches */}
                    {clientData.branches.map((branch) => {
                       const contacts = branchDetails[branch.id]?.contacts || [];

                       return (
                          <div key={branch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                             
                             {/* Branch Header */}
                             <div className="bg-gray-100/80 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                   <Building2 size={16} className="text-[#103c7f]"/>
                                   <h4 className="text-sm font-bold text-gray-800">{branch.name}</h4>
                                   <span className="text-[10px] text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">{branch.state}</span>
                                </div>
                             </div>

                             {/* Contacts Table */}
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                   <thead>
                                      <tr className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-100">
                                         <th className="px-4 py-3">Name</th>
                                         <th className="px-4 py-3">Details</th>
                                         <th className="px-4 py-3">Role & Dept</th>
                                         <th className="px-4 py-3 text-center">Primary</th>
                                         <th className="px-4 py-3">Handles</th>
                                      </tr>
                                   </thead>
                                   <tbody className="text-xs text-gray-700">
                                      {contacts.length > 0 ? contacts.map((c, index) => (
                                         <tr key={c.id} className={`hover:bg-blue-50/30 transition ${index !== contacts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            
                                            {/* Name */}
                                            <td className="px-4 py-3 font-bold text-[#103c7f]">
                                               {c.name}
                                            </td>

                                            {/* Contact Details */}
                                            <td className="px-4 py-3">
                                               <div className="flex flex-col gap-1">
                                                  <div className="flex items-center gap-1.5 text-gray-600">
                                                     <Phone size={10}/> {c.phone}
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-gray-600">
                                                     <Mail size={10}/> {c.email}
                                                  </div>
                                               </div>
                                            </td>

                                            {/* Designation & Dept (Mocked since data structure was simple before) */}
                                            <td className="px-4 py-3">
                                               <p className="font-semibold">{c.role}</p>
                                               <p className="text-[10px] text-gray-400">HR Dept</p> {/* Mock Dept */}
                                            </td>

                                            {/* Primary Contact (Mocked) */}
                                            <td className="px-4 py-3 text-center">
                                               {index === 0 ? ( // Mocking first contact as Primary
                                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Yes</span>
                                               ) : (
                                                  <span className="text-gray-300 text-[10px]">-</span>
                                               )}
                                            </td>

                                            {/* Handles (Mocked) */}
                                            <td className="px-4 py-3 text-gray-500 italic max-w-[150px] truncate">
                                               Recruitment & Onboarding... {/* Mock Data */}
                                            </td>

                                         </tr>
                                      )) : (
                                         <tr>
                                            <td colSpan="5" className="px-4 py-6 text-center text-gray-400 italic text-xs">
                                               No contacts found for this branch.
                                            </td>
                                         </tr>
                                      )}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       );
                    })}

                 </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                 <button onClick={() => setIsAllContactsOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-300 transition">Close List</button>
              </div>
           </div>
        </div>
      )}

      {/* ================= MODAL 9: VIEW ALL REQUIREMENTS (TABLE) ================= */}
      {isAllReqsOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white shrink-0">
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-wide">All Requirements</h3>
                    <p className="text-xs text-blue-200 opacity-80">Comprehensive list of active and closed mandates.</p>
                 </div>
                 <button onClick={() => setIsAllReqsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                 <div className="space-y-8">
                    
                    {/* Loop through branches */}
                    {clientData.branches.map((branch) => {
                       const requirements = branchDetails[branch.id]?.requirements || [];

                       return (
                          <div key={branch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                             
                             {/* Branch Header */}
                             <div className="bg-gray-100/80 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                   <Building2 size={16} className="text-[#103c7f]"/>
                                   <h4 className="text-sm font-bold text-gray-800">{branch.name}</h4>
                                   <span className="text-[10px] text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">{branch.state}</span>
                                </div>
                                <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                                   {requirements.length} Reqs
                                </span>
                             </div>

                             {/* Requirements Table */}
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                   <thead>
                                      <tr className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-100 whitespace-nowrap">
                                         <th className="px-4 py-3 min-w-[150px]">Job Title</th>
                                         <th className="px-4 py-3 text-center">JD Link</th>
                                         <th className="px-4 py-3">Experience</th>
                                         <th className="px-4 py-3">Package</th>
                                         <th className="px-4 py-3 text-center">Openings</th>
                                         <th className="px-4 py-3">Priority</th>
                                         <th className="px-4 py-3">Status</th>
                                         <th className="px-4 py-3">Timeline</th>
                                         <th className="px-4 py-3 text-right">Received Date</th>
                                      </tr>
                                   </thead>
                                   <tbody className="text-xs text-gray-700">
                                      {requirements.length > 0 ? requirements.map((req, index) => (
                                         <tr key={req.id} className={`hover:bg-blue-50/30 transition ${index !== requirements.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            
                                            {/* Job Title */}
                                            <td className="px-4 py-3 font-bold text-[#103c7f]">
                                               {req.title}
                                            </td>

                                            {/* JD Link */}
                                            <td className="px-4 py-3 text-center">
                                               <button className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-md transition-colors" title="View JD">
                                                  <LinkIcon size={12}/>
                                               </button>
                                            </td>

                                            {/* Experience */}
                                            <td className="px-4 py-3 font-medium">
                                               {req.experience || "2-4 Yrs"} {/* Mock Fallback */}
                                            </td>

                                            {/* Package */}
                                            <td className="px-4 py-3 font-medium">
                                               {req.package || "Not Disclosed"} {/* Mock Fallback */}
                                            </td>

                                            {/* Openings */}
                                            <td className="px-4 py-3 text-center font-bold">
                                               {req.openPositions}
                                            </td>

                                            {/* Priority */}
                                            <td className="px-4 py-3">
                                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                  req.priority === 'High' ? 'bg-red-50 text-red-600' : 
                                                  req.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'
                                               }`}>
                                                  {req.priority || "Medium"}
                                               </span>
                                            </td>

                                           {/* Status */}
                                            <td className="px-4 py-3">
                                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                  req.status === 'Done' ? 'bg-green-50 text-green-700' : 
                                                  req.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 
                                                  'bg-gray-100 text-gray-600' // Default for 'Not Started'
                                               }`}>
                                                  {req.status || "Done"}
                                               </span>
                                            </td>

                                            {/* Timeline */}
                                            <td className="px-4 py-3 text-gray-500">
                                               {req.timeline || "2024-01-21"}
                                            </td>

                                            {/* Received Date */}
                                            <td className="px-4 py-3 text-right text-gray-500 font-mono">
                                               {req.receivedDate || "2024-01-20"}
                                            </td>

                                         </tr>
                                      )) : (
                                         <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-gray-400 italic text-xs">
                                               No requirements posted for this branch yet.
                                            </td>
                                         </tr>
                                      )}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       );
                    })}

                 </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                 <button onClick={() => setIsAllReqsOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-300 transition">Close List</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}