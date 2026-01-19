"use client";
import Link from "next/link";
import { 
  Users, Briefcase, UserPlus, CheckCircle, 
  Clock, ArrowRight, Calendar, Phone, Mail,
  MoreHorizontal, AlertCircle, FileText
} from "lucide-react";

export default function CRMDashboard() {
  
  // --- MOCK DATA: Came from Sales Manager ---
  const newHandovers = [
    { id: 101, company: "Nexus Retail Group", salesRep: "Vikram Singh", date: "Jan 18, 2024", package: "Premium Plan", status: "PENDING" },
    { id: 102, company: "Urban Clap Ltd", salesRep: "Amit Verma", date: "Jan 19, 2024", package: "Standard Plan", status: "PENDING" },
  ];

  // --- MOCK DATA: Active CRM Clients ---
  const activeClients = [
    { id: 1, company: "Tech Solutions", contact: "Mr. Rakesh", status: "Active", health: "Good", renewal: "15 Days" },
    { id: 2, company: "BuildWell Corp", contact: "Ms. Priya", status: "Onboarding", health: "Neutral", renewal: "365 Days" },
    { id: 3, company: "Alpha Traders", contact: "Mr. John", status: "Risk", health: "Critical", renewal: "2 Days" },
  ];

  // --- MOCK DATA: Sidebar Agenda ---
  const myAgenda = [
    { id: 1, time: "11:00 AM", type: "Zoom", title: "Onboarding: Nexus Retail", note: "Introductory call with Purchase Mgr.", status: "Upcoming" },
    { id: 2, time: "03:00 PM", type: "Call", title: "Renewal Follow-up: Alpha", note: "Discuss pricing for next year.", status: "Pending" },
    { id: 3, time: "05:30 PM", type: "Email", title: "Send Weekly Reports", note: "To all Premium Clients", status: "Pending" },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden items-stretch">
      
      {/* ================= LEFT SECTION (MAIN DASHBOARD) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm flex justify-between items-center shrink-0 z-20">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic leading-none shrink-0">
              CRM Dashboard
            </h1>
            <p className="text-xs font-bold text-blue-200 mt-1.5 flex items-center gap-1.5">
              <Users size={12} /> Client Relations Dept
            </p>
          </div>
          <div className="bg-[#ffffff]/10 px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-bold flex items-center gap-2">
            <UserPlus size={16} className="text-orange-400" />
            <span>{newHandovers.length} New Handovers Pending</span>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-20">
          
          {/* 1. KPI CARDS */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            
            {/* Total Active Clients */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase size={60} className="text-blue-900"/></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Active Clients</p>
                <h3 className="text-3xl font-black text-[#103c7f] mt-1">142</h3>
              </div>
              <div className="mt-auto">
                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">+4 New this month</span>
              </div>
            </div>

            {/* Pending Onboarding (From Sales) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><UserPlus size={60} className="text-orange-600"/></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Onboarding</p>
                <h3 className="text-3xl font-black text-orange-600 mt-1">{newHandovers.length}</h3>
              </div>
              <div className="mt-auto">
                 <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Action Required</span>
              </div>
            </div>

            {/* Critical Renewals */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle size={60} className="text-red-600"/></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Renewals Due</p>
                <h3 className="text-3xl font-black text-red-600 mt-1">5</h3>
              </div>
              <div className="mt-auto">
                 <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Within 7 Days</span>
              </div>
            </div>
          </div>

          {/* 2. NEW HANDOVERS FROM SALES (Priority Section) */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h4 className="text-xs font-black text-[#103c7f] uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={16} /> New Handovers from Sales
              </h4>
              <Link href="/domestic/crm/onboard">
                <button className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Client Company</th>
                    <th className="px-6 py-4">Sales Rep</th>
                    <th className="px-6 py-4">Handover Date</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {newHandovers.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#103c7f] text-sm">{item.company}</div>
                        <div className="text-[10px] text-gray-500 font-semibold">{item.package}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                            {item.salesRep.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-gray-600">{item.salesRep}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="bg-[#103c7f] text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-blue-900 active:scale-95 transition-all shadow-md shadow-blue-900/10">
                          Start Onboarding
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. ACTIVE CLIENT DIRECTORY (Simplified) */}
          <div>
             <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Briefcase size={16} /> Client Directory Status
              </h4>
             <div className="space-y-3">
                {activeClients.map((client) => (
                  <div key={client.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-black text-lg border border-gray-100">
                        {client.company.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800 text-sm">{client.company}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{client.contact}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Health</p>
                        <span className={`text-xs font-bold ${
                          client.health === 'Good' ? 'text-green-600' : 
                          client.health === 'Critical' ? 'text-red-600' : 'text-gray-600'
                        }`}>{client.health}</span>
                      </div>
                      <div className="text-right w-24">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Renewal In</p>
                        <span className="text-xs font-bold text-[#103c7f]">{client.renewal}</span>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (SIDEBAR) ================= */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10 shrink-0 h-full">
        
        {/* HEADER */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm sticky top-0 z-10 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight uppercase italic">
            <Calendar size={20} className="text-orange-400" /> My Agenda
          </h2>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Today's Meetings (DYNAMIC MAP) */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Today's Meetings
            </h3>
            
            <div className="space-y-3">
              {myAgenda.map((item) => (
                <div key={item.id} className={`p-3 border rounded-xl ${
                  item.status === 'Upcoming' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                }`}>
                   <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        item.status === 'Upcoming' ? 'bg-white text-[#103c7f] border-blue-100' : 'bg-white text-gray-600 border-gray-200'
                      }`}>{item.time}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{item.type}</span>
                   </div>
                   <h4 className={`font-bold text-sm ${
                      item.status === 'Upcoming' ? 'text-[#103c7f]' : 'text-gray-700'
                   }`}>{item.title}</h4>
                   <p className="text-[10px] text-gray-500 mt-1 font-medium">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tasks */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle size={14} /> Quick Actions
            </h3>
            <div className="space-y-2">
               <button className="w-full text-left p-3 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors">
                     <Mail size={14} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-700">Send Welcome Kits</p>
                     <p className="text-[9px] text-gray-400 font-semibold">2 Pending for today</p>
                  </div>
               </button>

               <button className="w-full text-left p-3 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
                     <Phone size={14} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-700">Client Feedback Calls</p>
                     <p className="text-[9px] text-gray-400 font-semibold">Monthly check-ins</p>
                  </div>
               </button>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 mt-auto bg-white">
           <Link href="/domestic/crm/onboard">
             <button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
               <UserPlus size={18} /> View All Onboardings
             </button>
           </Link>
        </div>

      </div>

    </div>
  );
}