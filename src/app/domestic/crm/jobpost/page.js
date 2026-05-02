"use client";
import { useState, useMemo } from "react";
import { 
  FileText, Plus, X, Briefcase, Users,
  MapPin, IndianRupee, Calendar, Globe, Eye
} from "lucide-react";

export default function JobRequirementsPage() {
  
  // --- MOCK DATA (बैकएंड की जगह - सिर्फ ज़रूरी डेटा) ---
  const mockJds = [
    {
        jd_id: '1', created_date: '10 May 2026', client_name: 'TechCorp Solutions', 
        job_title: 'Senior React Developer', location: 'Pune, MH', experience: '3-5 Yrs',
        employment_type: 'Full Time', working_days: '5 Days', timings: '10 AM - 7 PM',
        package: '12 LPA', tool_requirement: 'React, Next.js, Tailwind', 
        job_summary: 'We are looking for an experienced React developer to lead our frontend team.',
        rnr: 'Lead the frontend team\nDevelop scalable UI components\nCollaborate with backend developers',
        req_skills: 'React.js\nNext.js\nTailwind CSS\nJavaScript (ES6+)',
        preferred_qual: 'B.Tech in Computer Science\nExperience with Vercel',
        company_offers: 'Health Insurance\nFlexible Working Hours\nFree Meals',
        contact_details: 'HR Manager\ncareers@techcorp.com\n+91 9876543210',
        status: 'Live', totalCVs: 45
    },
    {
        jd_id: '3', created_date: '11 May 2026', client_name: 'TechCorp Solutions', 
        job_title: 'Backend Node.js Eng', location: 'Pune, MH', experience: '4-6 Yrs',
        employment_type: 'Full Time', working_days: '5 Days', timings: '10 AM - 7 PM',
        package: '15 LPA', tool_requirement: 'Node.js, Express, MongoDB', 
        job_summary: 'Looking for a solid backend engineer.',
        status: 'Live', totalCVs: 10
    },
    {
        jd_id: '2', created_date: '08 May 2026', client_name: 'Global Finance Inc', 
        job_title: 'Data Analyst', location: 'Mumbai, MH', experience: '1-3 Yrs',
        employment_type: 'Contract', working_days: '6 Days', timings: '9 AM - 6 PM',
        package: '8 LPA', tool_requirement: 'Python, SQL, Tableau', 
        job_summary: 'Join our analytics team to drive data-based business decisions.',
        rnr: 'Analyze financial datasets\nCreate dashboards\nPresent findings to management',
        req_skills: 'SQL\nPython\nTableau\nExcel',
        preferred_qual: 'Degree in Statistics or Finance',
        company_offers: 'Performance Bonus\nRemote work options',
        contact_details: 'careers@globalfinance.com',
        status: 'Pending', totalCVs: 12
    }
  ];

  // --- STATE ---
  const [jds, setJds] = useState(mockJds);

  // Modal States
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);

  // CV Modal Data States (Mocked)
  const [cvModalData] = useState({ 
      postings: [
          { id: 1, platform: 'Naukri', posted_on: '11 May 2026', live_url: '#', current_stage: 'Active' }
      ], 
      cvLogs: [
          { id: 1, date: '12 May 2026', platform: 'Naukri', cv_received: 20, calls_done: 15 }
      ] 
  });

  // ==========================================
  // --- SMART INLINE FORM STATE & LOGIC ---
  // ==========================================
  
  // Extract unique client names from JDs
  const clientNames = useMemo(() => {
      const clients = jds.map(jd => jd.client_name).filter(Boolean);
      return [...new Set(clients)].sort();
  }, [jds]);

  const [inlineForm, setInlineForm] = useState({
      date: new Date().toISOString().split('T')[0], // Default to Today
      client_name: '',
      jd_id: '', 
      job_title: '',
      location: '',
      package: ''
  });

  // Filter Profiles based on selected Client
  const availableProfilesForClient = useMemo(() => {
      if (!inlineForm.client_name) return [];
      return jds.filter(jd => jd.client_name === inlineForm.client_name);
  }, [inlineForm.client_name, jds]);

  // Handle Client Change -> Reset Profile, Location, Package
  const handleClientChange = (e) => {
      setInlineForm(prev => ({
          ...prev,
          client_name: e.target.value,
          jd_id: '',
          job_title: '',
          location: '',
          package: ''
      }));
  };

  // Handle Profile Change -> Auto-fill Location, Package
  const handleProfileChange = (e) => {
      const selectedJdId = e.target.value;
      const foundJd = jds.find(jd => jd.jd_id === selectedJdId);
      
      if (foundJd) {
          setInlineForm(prev => ({
              ...prev,
              jd_id: foundJd.jd_id,
              job_title: foundJd.job_title,
              location: foundJd.location || '',
              package: foundJd.package || ''
          }));
      } else {
          setInlineForm(prev => ({ ...prev, jd_id: '', job_title: '', location: '', package: '' }));
      }
  };

  const handleAssign = () => {
      if (!inlineForm.client_name || !inlineForm.job_title) {
          alert("Please select Client and Profile to Assign.");
          return;
      }
      console.log("Assigning Payload:", inlineForm);
      alert(`Job Post Assignment Created successfully for ${inlineForm.job_title}! (Mock Action)`);
      
      // Reset form but keep date
      setInlineForm({
          date: new Date().toISOString().split('T')[0],
          client_name: '', jd_id: '', job_title: '', location: '', package: ''
      });
  };

  const handlePreview = (jdId) => {
      if(!jdId) return;
      const jd = jds.find(j => j.jd_id === jdId);
      if(jd) {
          localStorage.setItem('previewJD', JSON.stringify(jd));
          window.open(`/crm/jdview`, '_blank'); 
      }
  };

  const fetchCVModalData = (jdId) => {
    setSelectedJD(jds.find(j => j.jd_id === jdId));
    setIsCVModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2 print:p-0 print:bg-white">
      
      {/* 1. HEADER */}
      <div className="mb-6 print:hidden">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Post Job Requirements</h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign validated mandates to the Job Posting Team</p>
      </div>

      {/* ========================================================================= */}
      {/* --- SMART INLINE CREATION ROW --- */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 print:hidden relative overflow-visible">
          {/* Blue Left Border line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#103c7f] rounded-l-xl"></div>
          
          <div className="p-4 pl-6">
              <h3 className="text-[11px] font-black text-[#103c7f] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Plus size={14} /> Create New Assignment
              </h3>
              
              <div className="flex flex-wrap lg:flex-nowrap items-end gap-4">
                  
                  {/* Date (Default Today) */}
                  <div className="w-full md:w-[130px] shrink-0">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Date</label>
                      <input 
                        type="date" 
                        value={inlineForm.date}
                        onChange={(e) => setInlineForm({...inlineForm, date: e.target.value})}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 shadow-sm transition-all" 
                      />
                  </div>
                  
                  {/* Client Name (Dropdown) */}
                  <div className="w-full md:w-[200px] shrink-0">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Client Name</label>
                      <select 
                        value={inlineForm.client_name}
                        onChange={handleClientChange}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white cursor-pointer shadow-sm transition-all"
                      >
                          <option value="">Select Client</option>
                          {clientNames.map((name, idx) => (
                              <option key={idx} value={name}>{name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Profile / Job Title (Dropdown based on Client) */}
                  <div className="w-full lg:flex-1 shrink-0 min-w-[180px]">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Profile</label>
                      <select 
                        value={inlineForm.jd_id}
                        onChange={handleProfileChange}
                        disabled={!inlineForm.client_name}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 shadow-sm transition-all"
                      >
                          <option value="">{inlineForm.client_name ? "Select Profile" : "Select client first"}</option>
                          {availableProfilesForClient.map((jd) => (
                              <option key={jd.jd_id} value={jd.jd_id}>{jd.job_title}</option>
                          ))}
                      </select>
                  </div>

                  {/* Location (Auto-fills, Editable) */}
                  <div className="w-full md:w-[180px] shrink-0">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Pune" 
                        value={inlineForm.location}
                        onChange={(e) => setInlineForm({...inlineForm, location: e.target.value})}
                        disabled={!inlineForm.jd_id}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] disabled:bg-gray-50 shadow-sm transition-all" 
                      />
                  </div>

                  {/* Package (Auto-fills, Editable) */}
                  <div className="w-full md:w-[180px] shrink-0">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Package</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10 LPA" 
                        value={inlineForm.package}
                        onChange={(e) => setInlineForm({...inlineForm, package: e.target.value})}
                        disabled={!inlineForm.jd_id}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] disabled:bg-gray-50 shadow-sm transition-all" 
                      />
                  </div>

                  {/* View JD Button */}
                  <div className="w-full md:w-[180px] shrink-0">
                      {/* Invisible label just to push the button down equally */}
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block select-none"> View JD</label>
                      <button 
                        onClick={() => handlePreview(inlineForm.jd_id)}
                        disabled={!inlineForm.jd_id}
                        className="w-full h-9 flex items-center justify-center gap-1.5 border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                          <Eye size={14} className={inlineForm.jd_id ? "text-blue-500" : "text-gray-400"} /> View JD
                      </button>
                  </div>

                  {/* Submit / Assign Button */}
                  <div className="w-full md:w-[180px] shrink-0">
                      {/* Invisible label just to push the button down equally */}
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block select-none">Assign</label>
                      <button 
                        onClick={handleAssign} 
                        className="w-full h-9 flex items-center justify-center gap-1.5 bg-[#103c7f] hover:bg-blue-900 text-white px-4 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-md"
                      >
                          <Plus size={14} /> Assign
                      </button>
                  </div>
                  
              </div>
          </div>
      </div>

      {/* 2. TABLE (Read-Only Representation for the Mock) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#103c7f] text-white text-[11px] font-bold uppercase sticky top-0 z-10">
                    <tr>
                        <th className="p-3 border-r border-blue-800 whitespace-nowrap">Create Date</th>
                        <th className="p-3 border-r border-blue-800">Client Name</th>
                        <th className="p-3 border-r border-blue-800 w-64">Job Title</th>
                        <th className="p-3 border-r border-blue-800">Location & Package</th>
                        <th className="p-3 border-r border-blue-800 text-center">JD</th>
                        <th className="p-3 border-r border-blue-800 text-center">Post Status</th>
                        <th className="p-3 text-center">Applications Received</th>
                    </tr>
                </thead>
                <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                    {jds.length === 0 ? (
                      <tr><td colSpan={7} className="p-4 text-center text-gray-500">No Assignments found.</td></tr>
                    ) : (
                    jds.map((jd) => (
                        <tr key={jd.jd_id} className="hover:bg-blue-50/20 transition group">
                            <td className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-500 font-bold align-middle">
                                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-400"/> {jd.created_date || "N/A"}</div>
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-gray-800 align-middle">
                                {jd.client_name || "Internal"}
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-[#103c7f] text-sm leading-tight align-middle">
                                {jd.job_title}
                            </td>
                            <td className="p-2 border-r border-gray-100 align-middle">
                                <div className="flex flex-col gap-1.5">
                                    <span className="flex items-start gap-1 text-gray-600"><MapPin size={12} className="mt-0.5 shrink-0"/> {jd.location}</span>
                                    <span className="flex items-center gap-1 font-mono font-bold text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100"><IndianRupee size={12}/> {jd.package}</span>
                                </div>
                            </td>
                            
                            <td className="p-2 border-r border-gray-100 text-center align-middle">
                                <button 
                                   onClick={() => handlePreview(jd.jd_id)} 
                                   className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 mx-auto font-bold text-[10px] uppercase tracking-widest" 
                                   title="View Full JD"
                                >
                                   <Eye size={12}/> View JD
                                </button>
                            </td>

                            <td className="p-2 border-r border-gray-100 text-center align-middle">
                                <div className="flex flex-col items-center gap-1">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border whitespace-nowrap ${
                                        jd.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        jd.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}>
                                        {jd.status || 'Draft'}
                                    </span>
                                </div>
                            </td>

                            <td className="p-2 text-center align-middle">
                                <div className="flex justify-center">
                                    <button 
                                      onClick={() => fetchCVModalData(jd.jd_id)} 
                                      className="flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-md border border-purple-100 transition-colors font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                                      title="View Applications"
                                    >
                                        <Users size={12}/> {jd.totalCVs || 0} Apps
                                    </button>
                                </div>
                            </td>

                        </tr>
                    )))}
                </tbody>
             </table>
         </div>
      </div>

    {/* --- 6. VIEW APPLICANTS MODAL --- */}
      {isCVModalOpen && selectedJD && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative z-[10000]">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex gap-3 items-center">
                        <div className="p-2 bg-blue-50 text-[#103c7f] rounded-lg border border-blue-100">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight">Applications Data</h2>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-0.5">
                                <Briefcase size={12} /> {selectedJD.job_title} 
                                <span className="text-gray-300">|</span> 
                                <span className="text-[10px]">Client: {selectedJD.client_name || "Internal"}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsCVModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 transition bg-gray-50 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Content - Single Clean Table */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-3 border-r border-blue-800/30">Date</th>
                                    <th className="p-3 border-r border-blue-800/30">Candidate Name</th>
                                    <th className="p-3 border-r border-blue-800/30 text-center">CV Link</th>
                                    <th className="p-3">Latest Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                {/* Mock Row 1 */}
                                <tr className="hover:bg-blue-50/30 transition">
                                    <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">12 May 2026</td>
                                    <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Rahul Sharma</td>
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                                            <FileText size={12}/> View CV
                                        </a>
                                    </td>
                                    <td className="p-3 text-gray-600 italic">Interview scheduled for next Monday. Good technical skills.</td>
                                </tr>
                                
                                {/* Mock Row 2 */}
                                <tr className="hover:bg-blue-50/30 transition">
                                    <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">13 May 2026</td>
                                    <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Priya Desai</td>
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                                            <FileText size={12}/> View CV
                                        </a>
                                    </td>
                                    <td className="p-3 text-gray-600 italic">Rejected. Expected salary too high.</td>
                                </tr>

                                {/* Mock Row 3 */}
                                <tr className="hover:bg-blue-50/30 transition">
                                    <td className="p-3 border-r border-gray-100 whitespace-nowrap text-gray-500">14 May 2026</td>
                                    <td className="p-3 border-r border-gray-100 font-bold text-gray-900">Amit Verma</td>
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold">
                                            <FileText size={12}/> View CV
                                        </a>
                                    </td>
                                    <td className="p-3 text-gray-600 italic">Pending HR round.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}