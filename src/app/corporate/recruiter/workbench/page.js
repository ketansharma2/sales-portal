"use client";
import { useState } from "react";
import { 
    Search, Calendar, Briefcase, IndianRupee, 
    Target, Clock, TableProperties, Activity, CheckCircle2, 
    FileText, TrendingUp, Send, UserCheck, X, Database,
    Eye, Download, MapPin, CreditCard
} from "lucide-react";

export default function RecruiterWorkbenchPage() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // JD View Modal State (PDF Style)
    const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
    const [currentJdView, setCurrentJdView] = useState(null);

    // Form State for Work Done
    const initialForm = {
        advance_sti: "",
        cv_naukri: "",
        cv_indeed: "",
        cv_other: "",
        today_conversion: "",
        today_asset: "",
        tracker_sent: "",
        notes: "" // Added Notes state
    };
    const [formData, setFormData] = useState(initialForm);

    // --- MOCK JD DATA ---
    const mockJd1 = { title: "Telecouncellor", location: "Bangalore", experience: "1-3 Yrs", package_salary: "30k", employment_type: "Full Time", working_days: "6 Days", timings: "9:30 AM - 6 PM", tool_requirement: "CRM, Dialpad", summary: "Handle inbound inquiries and counsel students.", skills: "Communication, Convincing", preferred_qual: "Graduate", company_offers: "Incentives", contact_details: "hr@company.com", rnr: "Call leads\nCounsel students" };
    const mockJd2 = { title: "HR Manager", location: "Mumbai", experience: "5-7 Yrs", package_salary: "8LPA", employment_type: "Full Time", working_days: "5 Days", timings: "10 AM - 7 PM", tool_requirement: "HRIS", summary: "Manage HR operations.", skills: "Recruitment, Payroll", preferred_qual: "MBA HR", company_offers: "Health Insurance", contact_details: "hr@global.com", rnr: "Manage end to end HR\nPolicy making" };
    const mockJd3 = { title: "Java Developer", location: "Pune", experience: "3-5 Yrs", package_salary: "12LPA", employment_type: "Full Time", working_days: "5 Days", timings: "Flexible", tool_requirement: "Eclipse, Git", summary: "Backend development.", skills: "Java, Spring Boot", preferred_qual: "B.Tech", company_offers: "WFH options", contact_details: "tech@techcorp.com", rnr: "API creation\nBug fixing" };

    // --- MOCK DATA: Tasks assigned to the logged-in Recruiter (Client Name Removed) ---
    const [myTasks, setMyTasks] = useState([
        { id: 1, date: "2026-03-02", profile: "Telecouncellor", package: "30k", requirement: "350", slot: "09:30 AM - 01:00 PM", status: "Pending", lastLog: null, jd: mockJd1 },
        { id: 2, date: "2026-03-03", profile: "HR Manager", package: "8LPA", requirement: "1", slot: "Urgent (Immediate)", status: "Updated", lastLog: { totalCv: 15, sti: 2 }, jd: mockJd2 },
        { id: 3, date: "2026-03-04", profile: "Java Developer", package: "12LPA", requirement: "5", slot: "Full Day (10-6)", status: "Pending", lastLog: null, jd: mockJd3 },
        { id: 4, date: "2026-03-04", profile: "AutoCAD", package: "40k", requirement: "2", slot: "02:00 PM - 06:00 PM", status: "Pending", lastLog: null, jd: null }
    ]);

    // --- HANDLERS ---
    const handleOpenModal = (task) => {
        setSelectedTask(task);
        // Reset form for fresh entry
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const handleSaveWork = () => {
        // Calculate total CVs parsed
        const totalCv = (parseInt(formData.cv_naukri) || 0) + (parseInt(formData.cv_indeed) || 0) + (parseInt(formData.cv_other) || 0);

        const updatedTasks = myTasks.map(task => {
            if (task.id === selectedTask.id) {
                return {
                    ...task,
                    status: "Updated",
                    lastLog: {
                        totalCv: totalCv,
                        sti: parseInt(formData.advance_sti) || 0,
                        trackerSent: formData.tracker_sent,
                        notes: formData.notes // Save Notes Data
                    }
                };
            }
            return task;
        });

        setMyTasks(updatedTasks);
        handleCloseModal();
        alert("Daily Progress Logged Successfully!");
    };

    // Filter Logic
    const filteredTasks = myTasks.filter(item => 
        item.profile.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6 relative">
            
            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <TableProperties size={24}/> My Workbench
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        View assigned requirements & log daily work
                    </p>
                </div>
                
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search profile..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-72 outline-none focus:border-[#103c7f] transition shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* --- TASK TABLE --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar min-h-[60vh]">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 border-r border-blue-800 w-10 text-center">#</th>
                                <th className="p-4 border-r border-blue-800"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-4 border-r border-blue-800 min-w-[150px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-4 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg</div></th>
                                <th className="p-4 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Target size={12}/> Req.</div></th>
                                <th className="p-4 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> JD</div></th>
                                <th className="p-4 border-r border-blue-800 bg-[#0d316a] text-yellow-300"><div className="flex items-center gap-1.5"><Clock size={12}/> Slot Timing</div></th>
                                <th className="p-4 border-r border-blue-800 text-center">Status</th>
                                <th className="p-4 text-center bg-[#0d316a] w-36 sticky right-0 z-20">Action</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-200 bg-gray-50">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map((item, index) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 bg-white transition group">
                                    
                                    <td className="p-3 border-r border-gray-200 text-center text-gray-400 font-bold">
                                        {index + 1}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-200 font-mono text-gray-600">
                                        {item.date}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-200 font-bold text-gray-700">
                                        {item.profile}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-200 text-center font-bold text-green-700 bg-green-50/20">
                                        {item.package}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-200 text-center font-black text-[13px] text-gray-800">
                                        {item.requirement}
                                    </td>

                                    {/* JD View */}
                                    <td className="p-2 border-r border-gray-200 text-center align-middle">
                                        <button 
                                            onClick={() => { setCurrentJdView(item.jd); setIsJdViewModalOpen(true); }}
                                            disabled={!item.jd}
                                            className={`p-1.5 mx-auto flex items-center justify-center rounded transition ${item.jd ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200' : 'text-gray-400 bg-gray-50 cursor-not-allowed'}`}
                                            title={item.jd ? "View Attached JD" : "No JD Attached"}
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-200 font-bold text-purple-700 bg-purple-50/30">
                                        {item.slot}
                                    </td>

                                    <td className="p-3 border-r border-gray-200 text-center">
                                        {item.status === 'Updated' ? (
                                            <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                <CheckCircle2 size={10}/> Logged
                                            </span>
                                        ) : (
                                            <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                                                Pending
                                            </span>
                                        )}
                                    </td>

                                    {/* Action Column */}
                                    <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                                        <button 
                                            onClick={() => handleOpenModal(item)}
                                            className="bg-[#103c7f] text-white px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider hover:bg-blue-900 transition shadow-sm mx-auto flex items-center gap-1.5"
                                        >
                                            <Activity size={12}/> Update Work
                                        </button>
                                    </td>

                                </tr>
                            ))) : (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest bg-white">
                                        No tasks assigned yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- LOG PROGRESS MODAL --- */}
            {isModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                <Activity size={18}/> Log Daily Progress
                            </h3>
                            <button onClick={handleCloseModal} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 bg-gray-50 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            
                            {/* Task Summary Banner */}
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                                <div>
                                    <h4 className="text-lg font-black text-[#103c7f]">{selectedTask.profile}</h4>
                                    <p className="text-xs font-bold text-gray-600 mt-0.5 flex items-center gap-1">
                                        <Target size={12}/> Req: {selectedTask.requirement}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-white text-purple-700 border border-purple-200 px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">
                                        <Clock size={10} className="inline mr-1"/> {selectedTask.slot}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                
                                {/* 1. CVs Parsed Breakdown (Full Width) */}
                                <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h5 className="text-xs font-black text-gray-800 uppercase mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                                        <FileText size={14} className="text-blue-600"/> Today's CV Sourcing (Parsed)
                                    </h5>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">From Naukri</label>
                                            <input 
                                                type="number" min="0" placeholder="0"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold focus:border-[#103c7f] outline-none"
                                                value={formData.cv_naukri} onChange={(e) => setFormData({...formData, cv_naukri: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">From Indeed</label>
                                            <input 
                                                type="number" min="0" placeholder="0"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold focus:border-[#103c7f] outline-none"
                                                value={formData.cv_indeed} onChange={(e) => setFormData({...formData, cv_indeed: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Other Portals</label>
                                            <input 
                                                type="number" min="0" placeholder="0"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold focus:border-[#103c7f] outline-none"
                                                value={formData.cv_other} onChange={(e) => setFormData({...formData, cv_other: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-gray-50 p-2 rounded text-right text-xs font-bold text-gray-600">
                                        Total CVs Parsed Today: <span className="text-[#103c7f] font-black ml-1 text-sm">{(parseInt(formData.cv_naukri) || 0) + (parseInt(formData.cv_indeed) || 0) + (parseInt(formData.cv_other) || 0)}</span>
                                    </div>
                                </div>

                                {/* 2. Advance STI */}
                                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1.5 mb-2">
                                        <Send size={14} className="text-purple-600"/> Advance STI (Sent to Interview)
                                    </label>
                                    <input 
                                        type="number" min="0" placeholder="Count of candidates"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-purple-500 outline-none"
                                        value={formData.advance_sti} onChange={(e) => setFormData({...formData, advance_sti: e.target.value})}
                                    />
                                </div>

                                {/* 3. Today Conversion */}
                                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1.5 mb-2">
                                        <TrendingUp size={14} className="text-green-600"/> Today's Conversion
                                    </label>
                                    <input 
                                        type="number" min="0" placeholder="Count of successful conversions"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-green-500 outline-none"
                                        value={formData.today_conversion} onChange={(e) => setFormData({...formData, today_conversion: e.target.value})}
                                    />
                                </div>

                                {/* 4. Today Asset */}
                                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1.5 mb-2">
                                        <Database size={14} className="text-orange-500"/> Today's Asset
                                    </label>
                                    <input 
                                        type="number" min="0" placeholder="Total candidate assets built"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-orange-500 outline-none"
                                        value={formData.today_asset} onChange={(e) => setFormData({...formData, today_asset: e.target.value})}
                                    />
                                </div>

                                {/* 5. Tracker Sent to TL */}
                                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1.5 mb-2">
                                        <UserCheck size={14} className="text-[#103c7f]"/> Trackers Sent to TL
                                    </label>
                                    <input 
                                        type="number" min="0" placeholder="Count of trackers sent"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-[#103c7f] outline-none"
                                        value={formData.tracker_sent} 
                                        onChange={(e) => setFormData({...formData, tracker_sent: e.target.value})}
                                    />
                                </div>

                                {/* 6. Notes / Remarks */}
                                <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1.5 mb-2">
                                        <FileText size={14} className="text-gray-500"/> Additional Notes / Remarks
                                    </label>
                                    <textarea 
                                        rows="3"
                                        placeholder="Any special remarks, issues, or details about today's work..."
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none resize-none"
                                        value={formData.notes} 
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    ></textarea>
                                </div>

                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button onClick={handleSaveWork} className="bg-[#103c7f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                                <CheckCircle2 size={16}/> Submit Work Report
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* --- VIEW JD DETAILS MODAL (DOCUMENT PREVIEW) --- */}
            {isJdViewModalOpen && currentJdView && (
                <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[10000] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto">
                    
                    <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none print:overflow-visible">
                        
                        {/* Header (Hidden in Print) */}
                        <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                            <div className="flex items-center gap-3">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => window.print()} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                                    <Download size={16}/> Save as PDF
                                </button>
                                <button onClick={() => setIsJdViewModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* --- PDF CONTENT --- */}
                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:block print:overflow-visible print:bg-white print:p-0 custom-scrollbar">
                            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none" id="pdf-content">
                                
                                {/* 1. Header Logo */}
                                <div className="mb-10">
                                    <img src="/maven-logo.png" alt="Maven Jobs" style={{ width: '220px', height: '70px', objectFit: 'contain' }} />
                                </div>

                                {/* 2. Bordered Container */}
                                <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                                    
                                    {/* Key Value Pairs */}
                                    <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                        {currentJdView.title && <p><span className="font-bold">JOB TITLE : </span> {currentJdView.title}</p>}
                                        {currentJdView.location && <p><span className="font-bold">LOCATION : </span> {currentJdView.location}</p>}
                                        {currentJdView.experience && <p><span className="font-bold">EXPERIENCE : </span> {currentJdView.experience}</p>}
                                        {currentJdView.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {currentJdView.employment_type}</p>}
                                        {currentJdView.working_days && <p><span className="font-bold">WORKING DAYS : </span> {currentJdView.working_days}</p>}
                                        {currentJdView.timings && <p><span className="font-bold">TIMINGS : </span> {currentJdView.timings}</p>}
                                        {currentJdView.package_salary && <p><span className="font-bold">PACKAGE : </span> {currentJdView.package_salary}</p>}
                                        {currentJdView.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {currentJdView.tool_requirement}</p>}
                                    </div>

                                    {/* Sections */}
                                    <div className="space-y-8 text-[15px]">
                                        {currentJdView.summary && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{currentJdView.summary}</p></div>
                                        )}
                                        
                                        {currentJdView.rnr && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.skills && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.skills.split(',').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.preferred_qual && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.company_offers && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.contact_details && (
                                            <div className="mt-12 pt-6 border-t border-black/20">
                                                <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                                <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{currentJdView.contact_details}</div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}