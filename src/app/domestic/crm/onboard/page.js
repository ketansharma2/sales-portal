"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, Search, Filter, ArrowLeft, 
  MapPin, Phone, Mail, FileText, Download, 
  MessageSquare, User
} from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();

  // --- MOCK DATA: Clients for Onboarding ---
  const onboardingList = [
    { 
      id: 101, // Matches the ID in the detail page mock data
      date: "Jan 18, 2024", 
      company: "Nexus Retail Group", 
      category: "Retail / FMCG",
      location: "Gurgaon",
      state: "Haryana",
      contact: {
        name: "Mr. Vikram Singh",
        email: "vikram@nexus.com",
        phone: "+91 98765 43210"
      },
      remarks: "Payment received. Contract signed.",
      isAcknowledged: false
    },
    { 
      id: 102, 
      company: "Urban Clap Ltd", 
      date: "Jan 19, 2024", 
      category: "Service Aggregator",
      location: "Noida",
      state: "Uttar Pradesh",
      contact: {
        name: "Ms. Anjali Verma",
        email: "anjali.v@urban.co",
        phone: "+91 99887 77665"
      },
      remarks: "Missing GST Certificate.",
      isAcknowledged: true
    },
    { 
      id: 103, 
      company: "Green Earth Agro", 
      date: "Jan 20, 2024", 
      category: "Manufacturing",
      location: "Panipat",
      state: "Haryana",
      contact: {
        name: "Mr. Rajesh Kumar",
        email: "rajesh@greenearth.in",
        phone: "+91 88776 65544"
      },
      remarks: "High priority client.",
      isAcknowledged: false
    },
    { 
      id: 104, 
      company: "TechSys Solutions", 
      date: "Jan 21, 2024", 
      category: "IT / Software",
      location: "Chandigarh",
      state: "Punjab",
      contact: {
        name: "Mr. Amit Shah",
        email: "amit@techsys.com",
        phone: "+91 76543 21098"
      },
      remarks: "Welcome kit sent.",
      isAcknowledged: true
    },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden items-stretch">
      
      {/* ================= LEFT SECTION (TABLE VIEW) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm flex justify-between items-center shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Link href="/domestic/crm">
              <button className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic leading-none shrink-0">
                Onboarding Data
              </h1>
              <p className="text-xs font-bold text-blue-200 mt-1.5 flex items-center gap-1.5">
                <FileText size={12} /> Master Client List
              </p>
            </div>
          </div>
          
          <div className="bg-[#ffffff]/10 px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-bold text-center">
             <span className="block text-lg">{onboardingList.length}</span>
             <span className="text-[9px] text-blue-200 uppercase tracking-wider">Total Records</span>
          </div>
        </div>

        {/* 1ST ROW: FILTER SECTION */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Company, Name or State..." 
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f]/20 text-gray-700 transition-all"
            />
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all hover:border-gray-300">
               <Filter size={14} /> Filter List
             </button>
             <button className="flex items-center gap-2 bg-[#103c7f] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-900 transition-all shadow-md shadow-blue-900/10">
               <Download size={14} /> Export CSV
             </button>
          </div>
        </div>

        {/* 2ND SECTION: TABLE */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-20">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              
              {/* Table Headers */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-5 py-4 whitespace-nowrap">Onboarding Date</th>
                  <th className="px-5 py-4 whitespace-nowrap">Company Name</th>
                  <th className="px-5 py-4 whitespace-nowrap">Category</th>
                  <th className="px-5 py-4 whitespace-nowrap">Location & State</th>
                  <th className="px-5 py-4 whitespace-nowrap w-64">Contact Person</th>
                  <th className="px-5 py-4 whitespace-nowrap">Remarks</th>
                  <th className="px-5 py-4 whitespace-nowrap text-center">Acknowledged</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {onboardingList.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => router.push(`/domestic/crm/clients/${item.id}`)} // Navigate to detail page
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    
                    {/* Date */}
                    <td className="px-5 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Company */}
                    <td className="px-5 py-4">
                      <div className="font-black text-[#103c7f] text-sm">{item.company}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">ID: #{item.id}</div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold border border-gray-200">
                        {item.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                           <MapPin size={10} className="text-orange-500" /> {item.location}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold pl-3.5">{item.state}</span>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                           <User size={12} className="text-[#103c7f]" />
                           <span className="text-xs font-bold text-gray-800">{item.contact.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-0.5">
                           <Mail size={10} className="text-gray-400" />
                           <span className="text-[10px] text-gray-500 font-medium">{item.contact.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-0.5">
                           <Phone size={10} className="text-gray-400" />
                           <span className="text-[10px] text-gray-500 font-medium">{item.contact.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 group/tooltip relative w-fit">
                        <MessageSquare size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                          {item.remarks}
                        </span>
                      </div>
                    </td>

                    {/* Acknowledged (Action) */}
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                       {item.isAcknowledged ? (
                         <div className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                           <CheckCircle size={12} />
                           <span className="text-[10px] font-black uppercase">Done</span>
                         </div>
                       ) : (
                         <button className="bg-white border border-gray-300 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-[#103c7f] hover:text-white hover:border-[#103c7f] transition-all shadow-sm active:scale-95 uppercase tracking-wide">
                           Acknowledge
                         </button>
                       )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      
    </div>
  );
}