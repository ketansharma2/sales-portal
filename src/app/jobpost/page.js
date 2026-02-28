"use client";
import { useState } from "react";
import { 
  Calendar, Printer, FileSpreadsheet, Database, Briefcase, PhoneCall
} from "lucide-react";

export default function JobPosterReportDetailed() {
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [remarks, setRemarks] = useState("");

  // --- MOCK DATABASE 1: JOBS POSTED TODAY ---
  const [jobsPosted] = useState([
    { id: 1, date: getTodayDate(), sector: "Domestic", client: "Lakshya International School", profile: "Mathematics Teacher" },
    { id: 2, date: getTodayDate(), sector: "Domestic", client: "Lakshya International School", profile: "English Teacher" },
    { id: 3, date: getTodayDate(), sector: "Corporate", client: "TechCorp Solutions", profile: "React Developer" },
    { id: 4, date: getTodayDate(), sector: "Corporate", client: "Global Tech Inc.", profile: "Backend Node.js Eng." }
  ]);

  // --- MOCK DATABASE 2: DAILY PLATFORM STATS ---
  const [dailyPlatformStats] = useState([
    { id: 101, date: getTodayDate(), platform: "Indeed", cvsReceived: 54, callingDone: 49 },
    { id: 102, date: getTodayDate(), platform: "Naukri", cvsReceived: 37, callingDone: 30 }
  ]);

  // --- MOCK DATABASE 3: LIFETIME GRAND TOTALS ---
  const lifetimeTotals = {
      indeedCvs: 1250, indeedCalls: 1100,
      naukriCvs: 890, naukriCalls: 850
  };

  const handlePrint = () => window.print();

  const filteredJobs = jobsPosted.filter(r => r.date === selectedDate);
  const filteredStats = dailyPlatformStats.filter(r => r.date === selectedDate);

  return (
<div className="min-h-screen bg-gray-100 font-['Calibri'] p-1 md:p-8 print:p-0 print:bg-white print:min-h-0 print:block">      
      {/* --- HEADER CONTROLS (Hidden in Print) --- */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4 print:hidden">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                 <FileSpreadsheet size={24}/> Daily Report
             </h1>
         </div>
         <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                 <Calendar size={16} className="text-gray-400 mr-2"/>
                 <input 
                    type="date" 
                    className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                 />
             </div>
             <button onClick={handlePrint} className="flex items-center gap-2 bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2 rounded-lg font-bold transition shadow-md text-sm">
                 <Printer size={16}/> Print Report
             </button>
         </div>
      </div>

      {/* --- PROFESSIONAL REPORT PAPER --- */}
      <div className="bg-white border border-gray-200 shadow-xl max-w-6xl mx-auto print:shadow-none print:border-none print:w-full" id="report-paper">
          
          {/* Main Brand Header */}
          <div className="bg-[#103c7f] text-white px-6 py-3 flex justify-between items-center print:border-b-4 print:border-[#0d316a]">
              <div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Job Post Report</h2>
              </div>
              <div className="text-right border-l border-blue-400/30 pl-6">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Report Date</p>
                  <p className="text-xl font-black">{selectedDate.split('-').reverse().join('/')}</p>
              </div>
          </div>

          {/* TWO COLUMN LAYOUT (PART A & PART B side-by-side) */}
          <div className="flex flex-col lg:flex-row print:flex-row w-full border-b border-gray-200">
              
              {/* === LEFT COLUMN: PART A (Jobs Posted) === */}
              <div className="w-full lg:w-[65%] print:w-[65%] border-r border-gray-200 flex flex-col">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                      <Briefcase size={16} className="text-[#103c7f]"/>
                      <h3 className="font-black text-[#103c7f] uppercase text-sm tracking-widest">Jobs Posted Today ({filteredJobs.length})</h3>
                  </div>
                  
                  <div className="p-0 flex-1">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white border-b border-gray-200 text-[10px] uppercase text-gray-400 font-bold">
                              <tr>
                                  <th className="py-3 px-6 w-[20%]">Sector</th>
                                  <th className="py-3 px-4 w-[35%]">Client Name</th>
                                  <th className="py-3 px-4 w-[45%]">Profile Posted</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-800">
                              {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                  <tr key={job.id} className="hover:bg-gray-50">
                                      <td className="py-3 px-6">
                                          <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest ${job.sector === 'Domestic' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                              {job.sector}
                                          </span>
                                      </td>
                                      <td className="py-3 px-4 font-bold">{job.client}</td>
                                      <td className="py-3 px-4 text-[#103c7f] font-bold">{job.profile}</td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan="3" className="py-6 text-center text-gray-400 italic text-sm">No new jobs posted today.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* === RIGHT COLUMN: PART B (Today's Sourcing) === */}
              <div className="w-full lg:w-[35%] print:w-[35%] flex flex-col">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                      <Database size={16} className="text-green-700"/>
                      <h3 className="font-black text-green-700 uppercase text-sm tracking-widest">Today's Sourcing</h3>
                  </div>
                  
                  <div className="p-6 flex-1 bg-white">
                      <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gray-100 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200">
                              <tr>
                                  <th className="py-2 px-4 w-[40%]">Platform</th>
                                  <th className="py-2 px-4 w-[30%] text-center">CVs</th>
                                  <th className="py-2 px-4 w-[30%] text-center">Calling</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-800">
                              {filteredStats.length > 0 ? filteredStats.map(stat => (
                                  <tr key={stat.id}>
                                      <td className="py-3 px-4 font-black uppercase tracking-wider text-xs">{stat.platform}</td>
                                      <td className="py-3 px-4 text-center font-black text-base text-[#103c7f] bg-blue-50/30">{stat.cvsReceived}</td>
                                      <td className="py-3 px-4 text-center font-black text-base text-green-700 bg-green-50/30">{stat.callingDone}</td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan="3" className="py-4 text-center text-gray-400 italic text-xs">No activity logged.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          {/* === FOOTER: REMARKS & LIFETIME TOTALS === */}
          <div className="flex flex-col lg:flex-row print:flex-row w-full bg-white">
              
              {/* Remarks Box */}
              <div className="w-full lg:w-[65%] print:w-[65%] border-r border-gray-200 p-6 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Remarks / Notes</span>
                  <textarea 
                      className="w-full flex-1 min-h-[60px] p-3 text-gray-700 text-sm font-medium border border-gray-200 rounded-lg outline-none resize-none focus:border-[#103c7f] print:border-none print:p-0 print:text-black"
                      placeholder="Type any end of day remarks here..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                  ></textarea>
              </div>
              
              {/* Lifetime Totals Section */}
              <div className="w-full lg:w-[35%] print:w-[35%] bg-[#103c7f] text-white p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 border-b border-blue-800 pb-2 mb-4 justify-center">
                      <PhoneCall size={16} className="text-blue-300"/>
                      <h3 className="font-black uppercase text-sm tracking-widest text-blue-100">Total Database</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {/* Indeed Lifetime */}
                      <div className="text-center bg-white/10 rounded-lg p-3 border border-white/10 print:border-blue-300">
                          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">Indeed</p>
                          <div className="flex justify-between items-center text-left px-1">
                              <div>
                                  <p className="text-[9px] text-gray-300 uppercase">CVs</p>
                                  <p className="text-lg font-black">{lifetimeTotals.indeedCvs}</p>
                              </div>
                              <div className="w-px h-6 bg-blue-500"></div>
                              <div className="text-right">
                                  <p className="text-[9px] text-gray-300 uppercase">Calls</p>
                                  <p className="text-lg font-black text-green-400">{lifetimeTotals.indeedCalls}</p>
                              </div>
                          </div>
                      </div>

                      {/* Naukri Lifetime */}
                      <div className="text-center bg-white/10 rounded-lg p-3 border border-white/10 print:border-blue-300">
                          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">Naukri</p>
                          <div className="flex justify-between items-center text-left px-1">
                              <div>
                                  <p className="text-[9px] text-gray-300 uppercase">CVs</p>
                                  <p className="text-lg font-black">{lifetimeTotals.naukriCvs}</p>
                              </div>
                              <div className="w-px h-6 bg-blue-500"></div>
                              <div className="text-right">
                                  <p className="text-[9px] text-gray-300 uppercase">Calls</p>
                                  <p className="text-lg font-black text-green-400">{lifetimeTotals.naukriCalls}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* --- GLOBAL PRINT CSS --- */}
    {/* --- GLOBAL PRINT CSS --- */}
      <style jsx global>{`
        @media print {
            body { 
                background-color: white !important; 
                margin: 0; 
                padding: 0;
            }
            /* Landscape format best for side-by-side view */
            @page { 
                size: landscape; 
                margin: 10mm; 
            }
            #report-paper { 
                box-shadow: none !important; 
                border: 1px solid #e5e7eb !important; 
                border-radius: 0 !important;
            }
            /* Scrollbar Hataane ka pakka ilaaj */
            .overflow-x-auto, .overflow-hidden, .overflow-y-auto { 
                overflow: visible !important; 
            }
            ::-webkit-scrollbar { 
                display: none !important; 
            }
            * { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
            }
        }
      `}</style>
    </div>
  );
}