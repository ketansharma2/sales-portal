"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';
import {
  Filter, MapPin, Phone, User, Calendar,
  Building2, Search, Download, X
} from "lucide-react";

function FSETeamTracking() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedFse: "All"
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Team leads data - loaded from API
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // FSE team members for dropdown
  const [fseTeam, setFseTeam] = useState([]);
  const [fseLoading, setFseLoading] = useState(true);

  // Set mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch FSE team on mount
  useEffect(() => {
    if (mounted) {
      fetchFseTeam();
    }
  }, [mounted]);

  // Set filters from URL params on mount
  useEffect(() => {
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const selectedFse = searchParams.get('selectedFse');
    if (fromDate) setFilters(prev => ({ ...prev, fromDate }));
    if (toDate) setFilters(prev => ({ ...prev, toDate }));
    if (selectedFse) setFilters(prev => ({ ...prev, selectedFse }));
  }, [searchParams]);

  // Fetch leads on mount and when filters change
  useEffect(() => {
    if (!fseLoading) {
      fetchTodayClients();
    }
  }, [filters.selectedFse, filters.fromDate, filters.toDate, fseLoading]);

  const fetchFseTeam = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/manager/fse-team', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFseTeam(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch FSE team:', error);
    } finally {
      setFseLoading(false);
    }
  };

  const fetchTodayClients = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      let params = [];
      if (filters.selectedFse !== "All") params.push(`fse_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : "";
      const response = await fetch(`/api/corporate/manager/fse-clients-today${query}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        let sortedData = data.data;
        if (filters.selectedFse === "All") {
          sortedData = sortedData.sort((a, b) => {
            if (a.fse !== b.fse) {
              return a.fse.localeCompare(b.fse);
            }
            return new Date(b.latest_date) - new Date(a.latest_date);
          });
        } else {
          sortedData = sortedData.sort((a, b) => new Date(b.latest_date) - new Date(a.latest_date));
        }
        setLeads(sortedData);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fseList = [{ name: "All", user_id: "All" }, ...fseTeam];

  // Leads are already filtered by API
  const filteredLeads = leads;

  if (!mounted) return <div className="h-full flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-[calc(100vh-2rem)] bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden">

      {/* --- HEADER SECTION --- */}
      <div className="bg-white rounded-[16px] p-4 mb-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
            Team Field Tracking
          </h1>
          <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1.5 uppercase flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span>
             Live Field Updates
          </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="relative group"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div><input type="date" value={filters.fromDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onChange={(e) => handleFilterChange('fromDate', e.target.value)}/></div>
              <span className="text-gray-300 font-bold">-</span>
              <div className="relative group"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div><input type="date" value={filters.toDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onChange={(e) => handleFilterChange('toDate', e.target.value)}/></div>
              <button onClick={() => { handleFilterChange('fromDate', ''); handleFilterChange('toDate', ''); }} className="p-2 text-gray-400 hover:text-[#103c7f] hover:bg-blue-50 rounded-lg transition-all" title="Clear Date Filters"><X size={16} /></button>
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#103c7f]">
                 <Filter size={14} />
              </div>
              <select
               value={filters.selectedFse}
               onChange={(e) => handleFilterChange('selectedFse', e.target.value)}
               disabled={fseLoading}
               className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[12px] text-[11px] font-black text-[#103c7f] uppercase tracking-wide outline-none focus:border-[#103c7f] cursor-pointer appearance-none shadow-sm hover:bg-gray-100 transition-all min-w-[180px] disabled:opacity-50"
             >
               {fseLoading ? (
                 <option>Loading...</option>
               ) : (
                 fseList.map(fse => (
                   <option key={fse.user_id} value={fse.user_id}>{fse.name === "All" ? "All FSE Personnel" : fse.name}</option>
                 ))
               )}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M1 1L5 5L9 1" stroke="#103c7f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
           </div>
           <button className="bg-[#103c7f] text-white p-2 rounded-[12px] hover:bg-[#0d316a] transition-all shadow-md" title="Download Report">
             <Download size={16} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">

            <thead className="sticky top-0 bg-[#103c7f] text-white z-10 text-[10px] uppercase font-black tracking-[0.1em]">
              <tr>
                <th className="px-5 py-3.5">FSE Name</th>
                <th className="px-5 py-3.5">Company & Location</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5 text-center">Latest Date</th>
                <th className="px-5 py-3.5 text-center">Next Followup</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Sub-Status</th>
                <th className="px-5 py-3.5 text-center">Projection</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan="8" className="px-5 py-8 text-center text-gray-500">Loading today's client data...</td>
                    </tr>
                  );
                }
                if (filteredLeads.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" className="px-5 py-8 text-center text-gray-500">No client interactions today</td>
                    </tr>
                  );
                }
                return filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-blue-50 transition-all group">

                  {/* FSE Name */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#103c7f]">
                          <User size={14} strokeWidth={2.5} />
                       </div>
                       <span className="font-black text-[#103c7f] text-xs uppercase">{lead.fse}</span>
                    </div>
                  </td>

                  {/* Company & Location */}
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <Building2 size={12} className="text-gray-400"/> {lead.company}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1.5 pl-0.5">
                        <MapPin size={10} /> {lead.location}
                      </p>
                    </div>
                  </td>

                  {/* Contact Person & Number */}
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-bold text-gray-700 text-xs">{lead.contact_person}</p>
                      <p className="text-[10px] font-bold text-[#103c7f] mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {lead.phone}
                      </p>
                    </div>
                  </td>

                  {/* Latest Date */}
                  <td className="px-5 py-3 text-center">
                    <span className="font-bold text-gray-600 text-[11px]">{lead.latest_date}</span>
                  </td>

                  {/* Next Followup */}
                  <td className="px-5 py-3 text-center">
                     {lead.next_followup ? (
                       <span className="font-black text-orange-600 text-[11px] bg-orange-50 px-2 py-1 rounded-md">
                         {lead.next_followup}
                       </span>
                     ) : (
                       <span className="text-gray-300 text-[10px] font-bold">-</span>
                     )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border italic inline-block
                      ${lead.status === 'Onboarded' ? 'bg-green-50 text-green-700 border-green-100' :
                        lead.status === 'Interested' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        lead.status === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Sub-Status */}
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-bold text-gray-600 truncate block max-w-[120px]" title={lead.sub_status}>
                      {lead.sub_status}
                    </span>
                  </td>

                  {/* Projection */}
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] font-black uppercase
                      ${lead.projection === 'Hot' ? 'text-red-600' :
                        lead.projection === 'Warm' ? 'text-orange-500' :
                        lead.projection === 'Closed' ? 'text-green-600' : 'text-gray-400'}`}>
                      {lead.projection}
                    </span>
                  </td>

                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center text-[#103c7f] shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
               Data for: <span className="text-[#103c7f] font-black">{filters.selectedFse === "All" ? "All FSE Personnel" : fseTeam.find(f => f.user_id === filters.selectedFse)?.name || filters.selectedFse}</span>
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest">
               Count: <span className="text-lg italic">{filteredLeads.length}</span>
            </p>
        </div>

      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
      <FSETeamTracking />
    </Suspense>
  );
}