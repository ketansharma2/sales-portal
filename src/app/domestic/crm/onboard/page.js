"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Search, ArrowLeft,
  MapPin, Phone, Mail, FileText,
  MessageSquare, User, Filter
} from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(""); // State for Search
  const [loading, setLoading] = useState(true);

  // --- DATA STATE ---
  const [onboardingList, setOnboardingList] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/domestic/crm/onboard', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          // Format API data to match UI structure
          const formattedClients = data.data.map(client => ({
            id: client.client_id,
            date: client.onboarding_date ? new Date(client.onboarding_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            dateRaw: client.onboarding_date || '',
            company: client.company_name,
            category: client.category,
            location: client.location,
            state: client.state,
            contact: {
              name: client.contact_person || 'N/A',
              email: client.email || 'N/A',
              phone: client.phone || 'N/A'
            },
            remarks: client.remarks || 'No remarks',
            tnc: client.tnc || 'N/A',
            clientStatus: client.client_status || 'Inactive',
            isAcknowledged: client.status === 'Done' // Set to true if status is 'Done'
          })).sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
          setOnboardingList(formattedClients);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // --- LOGIC: Toggle Status ---
  const handleAcknowledge = async (id) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      if (!token) return;

      const response = await fetch('/api/domestic/crm/acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: id })
      });

      if (response.ok) {
        const updatedList = onboardingList.map((item) =>
          item.id === id ? { ...item, isAcknowledged: true } : item
        );
        setOnboardingList(updatedList);
      }
    } catch (error) {
      console.error('Error acknowledging client:', error);
    }
  };

  // --- LOGIC: Toggle Client Status ---
  const handleToggleStatus = async (id, currentStatus, companyName) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    if (!confirm(`Are you sure you want to change ${companyName}'s status to "${newStatus}"?`)) {
      return;
    }
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/crm/client-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: id, client_status: newStatus })
      });

      if (response.ok) {
        const updatedList = onboardingList.map((item) =>
          item.id === id ? { ...item, clientStatus: newStatus } : item
        );
        setOnboardingList(updatedList);
      }
    } catch (error) {
      console.error('Error toggling client status:', error);
    }
  };

  // --- LOGIC: Filter Data ---
  const filteredList = onboardingList.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (item.company && item.company.toLowerCase().includes(searchLower)) ||
      (item.contact.name && item.contact.name.toLowerCase().includes(searchLower)) ||
      (item.state && item.state.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower)) ||
      item.id.toString().includes(searchLower)
    );
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden items-stretch">
      
      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* 1. COMPACT HEADER */}
        <div className="bg-[#103c7f] h-14 px-4 border-b border-[#0d316a] shadow-md flex justify-between items-center shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/domestic/crm">
              <button className="bg-white/10 p-1.5 rounded-lg text-white hover:bg-white/20 transition-all flex items-center justify-center">
                <ArrowLeft size={16} />
              </button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-white tracking-wide uppercase leading-none">
                Onboarding Data
              </h1>
              <p className="text-[10px] text-blue-200 font-medium opacity-80 mt-0.5">
                Master Client List
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-blue-900/50 px-3 py-1 rounded border border-blue-400/30 text-white text-[10px] font-bold">
                 Total: {filteredList.length}
             </div>
          </div>
        </div>

        {/* 2. SEARCH & FILTER BAR */}
        <div className="bg-white px-4 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="relative w-96 group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#103c7f] transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Company, Name, State or ID..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f]/20 text-gray-700 transition-all placeholder:font-medium" 
            />
          </div>
          
         
        </div>

        {/* 3. TABLE SECTION */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                {/* Updated Header Color: Subtle Blue Tint */}
                <tr className="bg-[#103c7f]/5 border-b border-[#103c7f]/10 text-[10px] font-black text-[#103c7f] uppercase tracking-widest">
                  <th className="px-5 py-3 whitespace-nowrap">Onboarding Date</th>
                  <th className="px-5 py-3 whitespace-nowrap">Company Name</th>
                  <th className="px-5 py-3 whitespace-nowrap">Category</th>
                  <th className="px-5 py-3 whitespace-nowrap">Location & State</th>
                  <th className="px-5 py-3 whitespace-nowrap w-64">Contact Person</th>
                  <th className="px-5 py-3 whitespace-nowrap">Remarks</th>
                  <th className="px-5 py-3 whitespace-nowrap">TNC</th>
                  <th className="px-5 py-3 whitespace-nowrap">Client Status</th>
                  <th className="px-5 py-3 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103c7f] mb-2"></div>
                        <p className="text-sm font-bold">Loading clients...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => router.push(`/domestic/crm/clients/${item.id}`)}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-xs font-bold text-gray-500 whitespace-nowrap">{item.date}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-black text-[#103c7f] text-sm">{item.company}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">ID: #{item.id}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold border border-slate-200">{item.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><MapPin size={10} className="text-orange-500" /> {item.location}</span>
                          <span className="text-[10px] text-gray-400 font-semibold pl-3.5">{item.state}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5"><User size={12} className="text-[#103c7f]" /><span className="text-xs font-bold text-gray-800">{item.contact.name}</span></div>
                          <div className="flex items-center gap-1.5 pl-0.5"><Mail size={10} className="text-gray-400" /><span className="text-[10px] text-gray-500 font-medium">{item.contact.email}</span></div>
                          <div className="flex items-center gap-1.5 pl-0.5"><Phone size={10} className="text-gray-400" /><span className="text-[10px] text-gray-500 font-medium">{item.contact.phone}</span></div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 relative w-fit p-1.5 rounded hover:bg-yellow-50 transition-colors border border-transparent hover:border-yellow-100">
                          <MessageSquare size={14} className="text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-600 truncate max-w-[150px]" title={item.remarks}>{item.remarks}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-medium text-gray-600 truncate block max-w-[120px]" title={item.tnc}>{item.tnc}</span>
                      </td>

                      {/* --- CLIENT STATUS COLUMN --- */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleToggleStatus(item.id, item.clientStatus, item.company)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity ${
                            item.clientStatus === 'Active' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {item.clientStatus}
                        </button>
                      </td>

                      {/* --- ACTION COLUMN --- */}
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                         {item.isAcknowledged ? (
                           <div className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-md shadow-sm">
                             <CheckCircle size={12} />
                             <span className="text-[10px] font-black uppercase tracking-wide">Done</span>
                           </div>
                         ) : (
                           <button 
                             onClick={() => handleAcknowledge(item.id)}
                             className="bg-white border-b-2 border-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-[#103c7f] hover:text-white hover:border-[#103c7f] transition-all uppercase tracking-wide"
                           >
                             Acknowledge
                           </button>
                         )}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={32} className="opacity-20 mb-2"/>
                            <p className="text-sm font-bold">No records found matching "{searchQuery}"</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}