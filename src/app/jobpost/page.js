"use client";
import { useState, useEffect } from "react";
import { 
  Calendar, Printer, FileSpreadsheet, Database, Briefcase, PhoneCall
} from "lucide-react";

export default function JobPosterReportDetailed() {
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // --- API DATABASE 1: JOBS POSTED TODAY (from job_postings + domestic_crm_jd/corporate_crm_jd) ---
  const [jobsPosted, setJobsPosted] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Fetch jobs posted when selected date changes
  useEffect(() => {
    const fetchJobsPosted = async () => {
      setLoadingJobs(true);
      try {
        const res = await fetch(`/api/jobpost/jobs-posted?date=${selectedDate}`);
        const data = await res.json();
        if (data.success) {
          setJobsPosted(data.jobs);
        }
      } catch (error) {
        console.error('Error fetching jobs posted:', error);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobsPosted();
  }, [selectedDate]);

  // --- API DATABASE 2: DAILY PLATFORM STATS (from posting_data table) ---
  const [dailyPlatformStats, setDailyPlatformStats] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);

  // Fetch daily stats when selected date changes
  useEffect(() => {
    const fetchDailyStats = async () => {
      setLoadingDaily(true);
      try {
        const res = await fetch(`/api/jobpost/daily-stats?date=${selectedDate}`);
        const data = await res.json();
        if (data.success) {
          setDailyPlatformStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching daily stats:', error);
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchDailyStats();
  }, [selectedDate]);

  // --- API DATABASE 3: LIFETIME GRAND TOTALS (from posting_data table) ---
  const [lifetimeTotals, setLifetimeTotals] = useState({
    indeedCvs: 0, indeedCalls: 0,
    naukriCvs: 0, naukriCalls: 0,
    internshalaCvs: 0, internshalaCalls: 0
  });
  const [loadingTotals, setLoadingTotals] = useState(true);

  useEffect(() => {
    const fetchPlatformTotals = async () => {
      try {
        const res = await fetch('/api/jobpost/platform-totals');
        const data = await res.json();
        if (data.success) {
          setLifetimeTotals({
            indeedCvs: data.platformTotals.indeed?.cvs || 0,
            indeedCalls: data.platformTotals.indeed?.calls || 0,
            naukriCvs: data.platformTotals.naukri?.cvs || 0,
            naukriCalls: data.platformTotals.naukri?.calls || 0,
            internshalaCvs: data.platformTotals.internshala?.cvs || 0,
            internshalaCalls: data.platformTotals.internshala?.calls || 0
          });
        }
      } catch (error) {
        console.error('Error fetching platform totals:', error);
      } finally {
        setLoadingTotals(false);
      }
    };
    fetchPlatformTotals();
  }, []);

  const handlePrint = () => window.print();

  // Note: jobsPosted is already filtered by date from the API

  return (
    <div className="min-h-screen bg-gray-100 font-['Calibri'] p-1 md:p-8 print:p-0 print:bg-white print:min-h-0">
      <div className="Print-wrapper">
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
                      <h3 className="font-black text-[#103c7f] uppercase text-sm tracking-widest">Jobs Posted Today ({jobsPosted.length})</h3>
                  </div>
                  
                  <div className="p-0 flex-1">
                    {loadingJobs ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103c7f]"></div>
                        <span className="ml-3 text-gray-500 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white border-b border-gray-200 text-[10px] uppercase text-gray-400 font-bold">
                              <tr>
                                  <th className="py-3 px-6 w-[20%]">Sector</th>
                                  <th className="py-3 px-4 w-[35%]">Client Name</th>
                                  <th className="py-3 px-4 w-[45%]">Profile Posted</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-800">
                              {jobsPosted.length > 0 ? jobsPosted.map(job => (
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
                    )}
                  </div>
              </div>

              {/* === RIGHT COLUMN: PART B (Today's Sourcing) === */}
              <div className="w-full lg:w-[35%] print:w-[35%] flex flex-col">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                      <Database size={16} className="text-green-700"/>
                      <h3 className="font-black text-green-700 uppercase text-sm tracking-widest">Today's Sourcing</h3>
                  </div>
                  
                  <div className="p-4 flex-1 bg-white flex items-center justify-center">
                    {loadingDaily ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
                        <span className="ml-3 text-gray-500 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-2 px-4 w-[40%]">Platform</th>
                                    <th className="py-2 px-4 w-[30%] text-center">CVs</th>
                                    <th className="py-2 px-4 w-[30%] text-center">Calling</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-800">
                                {dailyPlatformStats.length > 0 ? dailyPlatformStats.map((stat, index) => (
                                    <tr key={index}>
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
                    )}
                  </div>
              </div>
          </div>

          {/* === FOOTER: LIFETIME TOTALS === */}
          <div className="w-full bg-[#103c7f] text-white p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 border-b border-blue-800 pb-2 mb-4 justify-center">
                  <PhoneCall size={16} className="text-blue-300"/>
                  <h3 className="font-black uppercase text-sm tracking-widest text-blue-100">Total Database</h3>
              </div>

              {loadingTotals ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-3 text-blue-200">Loading totals...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
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

                    {/* Internshala Lifetime */}
                    <div className="text-center bg-white/10 rounded-lg p-3 border border-white/10 print:border-blue-300">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">Internshala</p>
                        <div className="flex justify-between items-center text-left px-1">
                            <div>
                                <p className="text-[9px] text-gray-300 uppercase">CVs</p>
                                <p className="text-lg font-black">{lifetimeTotals.internshalaCvs}</p>
                            </div>
                            <div className="w-px h-6 bg-blue-500"></div>
                            <div className="text-right">
                                <p className="text-[9px] text-gray-300 uppercase">Calls</p>
                                <p className="text-lg font-black text-green-400">{lifetimeTotals.internshalaCalls}</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}
          </div>
      </div>

      {/* --- GLOBAL PRINT CSS --- */}
      <style jsx global>{`
        @media print {
            html, body { 
                background-color: white !important; 
                margin: 0 !important; 
                padding: 0 !important;
                height: 100vh !important;
                width: 100vw !important;
            }
            @page { 
                size: landscape; 
                margin: 0;
            }
            .Print-wrapper {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                height: 100vh !important;
                min-height: 100vh !important;
            }
            #report-paper { 
                box-shadow: none !important; 
                border: none !important; 
                border-radius: 0 !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            #report-paper * {
                box-sizing: border-box;
            }
            .overflow-x-auto { 
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
    </div>
  );
}
