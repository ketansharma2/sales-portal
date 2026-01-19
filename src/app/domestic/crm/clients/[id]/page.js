"use client";
import { useState } from "react";
import Link from "next/link";
import { 
  Building2, MapPin, Phone, Mail, User, 
  FileText, Plus, ChevronRight, ArrowLeft,
  MessageSquare, Link as LinkIcon, Clock,
  MoreHorizontal, Briefcase, CheckCircle
} from "lucide-react";

export default function ClientMasterProfile() {
  
  // --- MOCK DATA: The Complex Hierarchy ---
  
  // 1. Master Client Details
  const clientData = {
    id: 101,
    name: "Nexus Retail Group",
    industry: "Retail / FMCG",
    gst: "07AAACN1234F1Z5",
    onboardedOn: "Jan 18, 2024",
    status: "Active",
    branches: [
      { id: 'b1', name: "Gurgaon HQ", state: "Haryana", type: "Corporate" },
      { id: 'b2', name: "Noida Warehouse", state: "Uttar Pradesh", type: "Warehouse" },
      { id: 'b3', name: "Mumbai Regional Office", state: "Maharashtra", type: "Regional" },
    ]
  };

  // 2. State to manage which branch is selected
  const [selectedBranchId, setSelectedBranchId] = useState('b1');

  // 3. Data for the SELECTED Branch (This would come from API based on ID)
  const branchDetails = {
    'b1': {
      address: "DLF Cyber City, Phase 3, Gurgaon",
      contacts: [
        { id: 'c1', name: "Mr. Vikram Singh", role: "HR Director", phone: "+91 98765 43210", email: "vikram@nexus.com" },
        { id: 'c2', name: "Ms. Sneha", role: "Talent Acquisition", phone: "+91 99887 76655", email: "sneha@nexus.com" }
      ],
      requirements: [
        { id: 'r1', title: "Senior Data Analyst", openPositions: 2, status: "Active", pocId: 'c1' },
        { id: 'r2', title: "Marketing Manager", openPositions: 1, status: "Closed", pocId: 'c1' }
      ],
      logs: [
        { id: 1, date: "Today, 10:30 AM", type: "Call", msg: "Spoke to Vikram regarding Data Analyst profiles. He wants 3 years exp min.", author: "You" },
        { id: 2, date: "Yesterday, 4:00 PM", type: "Tracker", msg: "Shared Candidate Tracker v1 for Marketing Role.", link: "https://docs.google.com/sheets/...", author: "You" }
      ]
    },
    'b2': {
      address: "Sector 63, Noida Electronic City",
      contacts: [
        { id: 'c3', name: "Mr. Amit Kumar", role: "Warehouse Mgr", phone: "+91 88776 65544", email: "amit@nexus.com" }
      ],
      requirements: [
        { id: 'r3', title: "Logistics Coordinator", openPositions: 5, status: "Active", pocId: 'c3' }
      ],
      logs: [
        { id: 3, date: "Jan 20", type: "Email", msg: "Sent commercial proposal for warehouse staff.", author: "You" }
      ]
    },
    'b3': {
      address: "Bandra Kurla Complex, Mumbai",
      contacts: [],
      requirements: [],
      logs: []
    }
  };

  const currentBranchData = branchDetails[selectedBranchId];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden items-stretch">
      
      {/* ================= LEFT SIDE: CLIENT & BRANCH NAVIGATOR ================= */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-xl">
        
        {/* HEADER: Back & Master Info */}
        <div className="p-5 bg-[#103c7f] text-white shrink-0">
          <Link href="/domestic/crm/onboard" className="flex items-center gap-2 text-blue-200 hover:text-white text-xs font-bold mb-4 transition-colors">
             <ArrowLeft size={14} /> Back to List
          </Link>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg font-black text-white border border-white/20">
               {clientData.name.charAt(0)}
             </div>
             <div>
               <h1 className="text-lg font-black leading-tight">{clientData.name}</h1>
               <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                 {clientData.status}
               </span>
             </div>
          </div>
          <div className="text-[10px] text-blue-100 font-medium space-y-0.5 opacity-80">
            <p>GST: {clientData.gst}</p>
            <p>Industry: {clientData.industry}</p>
          </div>
        </div>

        {/* BRANCH LIST (The Navigation) */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3 px-2">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Branches / Sites</h3>
               <button className="text-[#103c7f] hover:bg-blue-50 p-1 rounded transition-colors"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-2">
              {clientData.branches.map((branch) => (
                <button 
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${
                    selectedBranchId === branch.id 
                    ? "bg-white border-[#103c7f] shadow-md" 
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  {selectedBranchId === branch.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#103c7f]"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold ${selectedBranchId === branch.id ? "text-[#103c7f]" : "text-gray-700"}`}>
                      {branch.name}
                    </span>
                    {selectedBranchId === branch.id && <ChevronRight size={14} className="text-[#103c7f]" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                    <MapPin size={10} /> {branch.state}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: BRANCH DETAILS (The Action Area) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* BRANCH HEADER */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-start shrink-0 bg-white">
          <div>
             <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
               {clientData.branches.find(b => b.id === selectedBranchId)?.name}
               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 uppercase tracking-wider font-bold">
                 {clientData.branches.find(b => b.id === selectedBranchId)?.type}
               </span>
             </h2>
             <p className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-1">
               <MapPin size={12} /> {currentBranchData.address}
             </p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 bg-[#103c7f] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-900 shadow-lg shadow-blue-900/10 transition-all active:scale-95">
               <Plus size={14} /> New Requirement
             </button>
          </div>
        </div>

        {/* SCROLLABLE DASHBOARD AREA */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: PEOPLE (Contacts) & JOBS (Requirements) */}
            <div className="space-y-8">
              
              {/* CONTACTS SECTION */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User size={14} /> Key Contacts
                  </h3>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline">+ Add Person</button>
                </div>
                
                {currentBranchData.contacts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {currentBranchData.contacts.map((contact) => (
                      <div key={contact.id} className="p-3 border border-gray-200 rounded-xl flex items-center gap-3 hover:border-blue-300 transition-all group bg-gray-50/50">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                           {contact.name.charAt(0)}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-800 truncate">{contact.name}</h4>
                           <p className="text-[10px] text-gray-500 font-bold uppercase">{contact.role}</p>
                         </div>
                         <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-white hover:shadow rounded text-gray-500 hover:text-green-600"><Phone size={14} /></button>
                            <button className="p-1.5 hover:bg-white hover:shadow rounded text-gray-500 hover:text-blue-600"><Mail size={14} /></button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400">No contacts added for this branch yet.</p>
                  </div>
                )}
              </section>

              {/* REQUIREMENTS SECTION */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase size={14} /> Open Requirements
                  </h3>
                </div>

                {currentBranchData.requirements.length > 0 ? (
                  <div className="space-y-3">
                    {currentBranchData.requirements.map((req) => (
                      <div key={req.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-all group">
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="text-sm font-black text-[#103c7f]">{req.title}</h4>
                           <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                             req.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-500'
                           }`}>{req.status}</span>
                         </div>
                         <div className="flex items-center gap-4 text-[10px] text-gray-500 font-semibold mb-3">
                           <span>{req.openPositions} Positions</span>
                           <span>•</span>
                           <span>POC: {currentBranchData.contacts.find(c => c.id === req.pocId)?.name || 'Unknown'}</span>
                         </div>
                         <div className="pt-3 border-t border-gray-100 flex gap-2">
                            <button className="flex-1 bg-gray-50 text-gray-600 py-1.5 rounded text-[10px] font-bold hover:bg-gray-100">View Tracker</button>
                            <button className="flex-1 bg-[#103c7f] text-white py-1.5 rounded text-[10px] font-bold hover:bg-blue-900">Share Profiles</button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400">No active requirements.</p>
                  </div>
                )}
              </section>

            </div>

            {/* COLUMN 2: ACTIVITY & TRACKERS (The Conversation History) */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 h-fit">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                 <Clock size={14} /> Branch Activity Log
               </h3>

               {/* TIMELINE */}
               <div className="space-y-6 relative pl-2">
                 {/* Vertical Line */}
                 <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-200"></div>

                 {/* New Activity Input */}
                 <div className="relative z-10 bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <textarea 
                      placeholder="Log a call, email summary or paste a tracker link..." 
                      rows="2"
                      className="w-full text-xs font-medium bg-transparent outline-none resize-none placeholder:text-gray-400 text-gray-700"
                    ></textarea>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                       <div className="flex gap-2">
                          <button className="text-gray-400 hover:text-blue-500"><Phone size={14}/></button>
                          <button className="text-gray-400 hover:text-green-500"><LinkIcon size={14}/></button>
                       </div>
                       <button className="bg-[#103c7f] text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-blue-900">Log Activity</button>
                    </div>
                 </div>

                 {/* Logs */}
                 {currentBranchData.logs.length > 0 ? (
                    currentBranchData.logs.map((log) => (
                      <div key={log.id} className="relative z-10 pl-6 group">
                         <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-[#103c7f] transition-colors">
                            {log.type === 'Call' && <Phone size={10} className="text-gray-400 group-hover:text-[#103c7f]" />}
                            {log.type === 'Tracker' && <LinkIcon size={10} className="text-gray-400 group-hover:text-[#103c7f]" />}
                            {log.type === 'Email' && <Mail size={10} className="text-gray-400 group-hover:text-[#103c7f]" />}
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                               <span className="text-[10px] font-black text-gray-700 uppercase">{log.author} logged a {log.type}</span>
                               <span className="text-[9px] font-bold text-gray-400">{log.date}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium leading-relaxed">
                              {log.msg}
                            </p>
                            {log.link && (
                              <a href="#" className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2 hover:underline">
                                <LinkIcon size={10} /> Open Attached Tracker
                              </a>
                            )}
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs text-gray-400 pl-6 italic">No recent activity for this branch.</p>
                 )}

               </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}