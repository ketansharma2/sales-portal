"use client";
import { useState, useMemo } from "react";
import { 
  Calendar, Printer, Download, FileSpreadsheet, Building2, Briefcase
} from "lucide-react";

export default function JobPosterReport() {
  
  // --- STATE FOR DATE SELECTION ---
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [remarks, setRemarks] = useState("");

  // --- MOCK DATABASE (Simulating daily records) ---
  // Real app mein ye data backend (API) se selectedDate ke basis pe fetch hoga
  const reportDataByDate = {
    "2026-02-25": {
        domestic: {
            profiles: [
                "Lakshya international school - Mathematics Teacher",
                "Lakshya international school - English Teacher",
                "Lakshya international school - Principal",
                "Maven Jobs - RECRUITER-Consulting",
                "branopac pvt ltd - Store Incharge",
                "Savvi Sales & Services Pvt. Ltd - Stock Trader"
            ],
            jobsPosted: 6,
            dataEntries: { indeed: 39, naukri: 0 },
            callingDone: { indeed: 39, naukri: 0 }
        },
        corporate: {
            profiles: [],
            jobsPosted: 0,
            dataEntries: { indeed: 0, naukri: 0 },
            callingDone: { indeed: 0, naukri: 0 }
        }
    },
    "2026-02-26": { // Example of another date
        domestic: {
            profiles: ["TechCorp Solutions - Business Development Executive"],
            jobsPosted: 1,
            dataEntries: { indeed: 10, naukri: 5 },
            callingDone: { indeed: 8, naukri: 5 }
        },
        corporate: {
            profiles: ["Global Tech Inc. - Senior React Developer"],
            jobsPosted: 1,
            dataEntries: { indeed: 15, naukri: 20 },
            callingDone: { indeed: 10, naukri: 15 }
        }
    }
  };

  // Get data for selected date (Fallback to empty state if no data)
  const currentReport = reportDataByDate[selectedDate] || {
      domestic: { profiles: [], jobsPosted: 0, dataEntries: { indeed: 0, naukri: 0 }, callingDone: { indeed: 0, naukri: 0 } },
      corporate: { profiles: [], jobsPosted: 0, dataEntries: { indeed: 0, naukri: 0 }, callingDone: { indeed: 0, naukri: 0 } }
  };

  // --- AUTO CALCULATE TOTALS ---
  const totals = useMemo(() => {
      return {
          jobsPosted: currentReport.domestic.jobsPosted + currentReport.corporate.jobsPosted,
          dataEntries: {
              indeed: currentReport.domestic.dataEntries.indeed + currentReport.corporate.dataEntries.indeed,
              naukri: currentReport.domestic.dataEntries.naukri + currentReport.corporate.dataEntries.naukri,
          },
          callingDone: {
              indeed: currentReport.domestic.callingDone.indeed + currentReport.corporate.callingDone.indeed,
              naukri: currentReport.domestic.callingDone.naukri + currentReport.corporate.callingDone.naukri,
          }
      };
  }, [currentReport]);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-8 print:p-0 print:bg-white">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 print:hidden">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                 <FileSpreadsheet size={24}/> Daily Job Posting Report
             </h1>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Track Daily Posts, Data Entries & Calls</p>
         </div>
         
         <div className="flex flex-wrap items-center gap-3">
             {/* Date Picker */}
             <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:border-[#103c7f] transition">
                 <Calendar size={16} className="text-gray-400 mr-2"/>
                 <input 
                    type="date" 
                    className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                 />
             </div>
             
             {/* Action Buttons */}
             <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#103c7f] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-bold transition shadow-md text-sm">
                 <Printer size={16}/> Print Report
             </button>
             <button className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-md text-sm">
                 <Download size={16}/> Export Excel
             </button>
         </div>
      </div>

      {/* --- REPORT TABLE (EXCEL STYLE) --- */}
      <div className="bg-white border-2 border-[#103c7f] rounded-lg overflow-hidden shadow-xl" id="report-content">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                  
                  {/* MAIN HEADER (Blue) */}
                  <thead className="bg-[#103c7f] text-white">
                      <tr>
                          <th colSpan="3" className="p-3 text-center text-lg font-black uppercase tracking-widest border-r border-blue-900">
                              Babita Job Posting Report
                          </th>
                          <th className="p-3 text-center font-bold border-r border-blue-900 uppercase">
                              Date
                          </th>
                          <th colSpan="2" className="p-3 text-center text-lg font-black tracking-widest bg-blue-800">
                              {selectedDate.split('-').reverse().join('/')}
                          </th>
                      </tr>
                      <tr className="bg-blue-900/50 text-xs tracking-wider">
                          <th className="p-3 text-center border-r border-t border-blue-800 w-[12%]">Sector</th>
                          <th colSpan="2" className="p-3 text-center border-r border-t border-blue-800 w-[44%]">Latest J.P Profiles</th>
                          <th className="p-3 text-center border-r border-t border-blue-800 w-[12%]">Jobs Posted</th>
                          <th className="p-3 text-center border-r border-t border-blue-800 w-[16%]">Data Entries</th>
                          <th className="p-3 text-center border-t border-blue-800 w-[16%]">Calling Done</th>
                      </tr>
                  </thead>

                  <tbody className="text-sm font-medium text-gray-800">
                      
                      {/* --- DOMESTIC ROW --- */}
                      <tr className="border-b border-gray-300">
                          <td className="p-4 text-center border-r border-gray-300 font-black text-[#103c7f] uppercase bg-blue-50/50">
                              Domestic
                          </td>
                          <td colSpan="2" className="p-4 border-r border-gray-300 align-top">
                              {currentReport.domestic.profiles.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1.5">
                                      {currentReport.domestic.profiles.map((profile, idx) => (
                                          <li key={idx} className="text-gray-700 font-bold">{profile}</li>
                                      ))}
                                  </ul>
                              ) : (
                                  <span className="text-gray-400 italic">No domestic profiles posted</span>
                              )}
                          </td>
                          <td className="p-4 text-center border-r border-gray-300 font-black text-lg align-middle">
                              {currentReport.domestic.jobsPosted}
                          </td>
                          <td className="p-4 text-center border-r border-gray-300 align-middle">
                              <div className="flex flex-col gap-1 text-sm font-bold text-gray-600">
                                  <p>Indeed = <span className="text-black">{currentReport.domestic.dataEntries.indeed}</span></p>
                                  <p>Naukri = <span className="text-black">{currentReport.domestic.dataEntries.naukri}</span></p>
                              </div>
                          </td>
                          <td className="p-4 text-center align-middle bg-gray-50/50">
                              <div className="flex flex-col gap-1 text-sm font-bold text-gray-600">
                                  <p>Indeed = <span className="text-black">{currentReport.domestic.callingDone.indeed}</span></p>
                                  <p>Naukri = <span className="text-black">{currentReport.domestic.callingDone.naukri}</span></p>
                              </div>
                          </td>
                      </tr>

                      {/* --- CORPORATE ROW --- */}
                      <tr className="border-b border-gray-300">
                          <td className="p-4 text-center border-r border-gray-300 font-black text-purple-700 uppercase bg-purple-50/50">
                              Corporate
                          </td>
                          <td colSpan="2" className="p-4 border-r border-gray-300 align-top">
                              {currentReport.corporate.profiles.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1.5">
                                      {currentReport.corporate.profiles.map((profile, idx) => (
                                          <li key={idx} className="text-gray-700 font-bold">{profile}</li>
                                      ))}
                                  </ul>
                              ) : (
                                  <span className="text-gray-400 italic">No corporate profiles posted</span>
                              )}
                          </td>
                          <td className="p-4 text-center border-r border-gray-300 font-black text-lg align-middle">
                              {currentReport.corporate.jobsPosted}
                          </td>
                          <td className="p-4 text-center border-r border-gray-300 align-middle">
                              <div className="flex flex-col gap-1 text-sm font-bold text-gray-600">
                                  <p>Indeed = <span className="text-black">{currentReport.corporate.dataEntries.indeed}</span></p>
                                  <p>Naukri = <span className="text-black">{currentReport.corporate.dataEntries.naukri}</span></p>
                              </div>
                          </td>
                          <td className="p-4 text-center align-middle bg-gray-50/50">
                              <div className="flex flex-col gap-1 text-sm font-bold text-gray-600">
                                  <p>Indeed = <span className="text-black">{currentReport.corporate.callingDone.indeed}</span></p>
                                  <p>Naukri = <span className="text-black">{currentReport.corporate.callingDone.naukri}</span></p>
                              </div>
                          </td>
                      </tr>

                      {/* --- TOTALS & REMARKS ROW --- */}
                      <tr className="bg-[#103c7f] text-white">
                          <td className="p-4 text-center border-r border-blue-800 font-black uppercase tracking-wider">
                              Remarks
                          </td>
                          <td colSpan="2" className="p-2 border-r border-blue-800 bg-white">
                              {/* Editable Textarea for Remarks */}
                              <textarea 
                                  className="w-full h-full min-h-[60px] p-2 text-black text-sm font-medium outline-none resize-none placeholder-gray-300 bg-transparent print:bg-white"
                                  placeholder="Type any remarks or notes here before printing..."
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                              ></textarea>
                          </td>
                          <td className="p-4 text-center border-r border-blue-800 font-black uppercase text-lg tracking-widest bg-blue-900">
                              Total
                          </td>
                          <td className="p-4 text-center border-r border-blue-800 bg-white text-gray-800">
                              <div className="flex flex-col gap-1 text-sm font-black">
                                  <p className="text-[#103c7f]">Indeed = <span className="text-xl">{totals.dataEntries.indeed}</span></p>
                                  <p className="text-green-600">Naukri = <span className="text-xl">{totals.dataEntries.naukri}</span></p>
                              </div>
                          </td>
                          <td className="p-4 text-center bg-gray-100 text-gray-800">
                              <div className="flex flex-col gap-1 text-sm font-black">
                                  <p className="text-[#103c7f]">Indeed = <span className="text-xl">{totals.callingDone.indeed}</span></p>
                                  <p className="text-green-600">Naukri = <span className="text-xl">{totals.callingDone.naukri}</span></p>
                              </div>
                          </td>
                      </tr>

                  </tbody>
              </table>
          </div>
      </div>

      {/* --- GLOBAL PRINT CSS --- */}
      <style jsx global>{`
        @media print {
            body {
                background-color: white !important;
                margin: 0;
            }
            @page {
                size: landscape; /* Table looks better in landscape for printing */
                margin: 10mm;
            }
            #report-content {
                box-shadow: none !important;
                border: 2px solid #103c7f !important;
            }
            /* Ensure background colors print correctly */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}</style>
      
    </div>
  );
}