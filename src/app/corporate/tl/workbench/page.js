"use client";
import { useState } from "react";
import { 
    Search, Calendar, Building2, Briefcase, IndianRupee, 
    Target, Users, Clock, LayoutGrid, CheckCircle2, 
    Send, Activity, X, BarChart2, Users2, PhoneCall,
    FileText, UserCheck, TrendingUp, Database, MessageSquarePlus // Added MessageSquarePlus
} from "lucide-react";

export default function TLWorkbenchPage() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    
    // View Work Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState(null);

    // Add Remark Modal State
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkTask, setSelectedRemarkTask] = useState(null);
    const [remarkForm, setRemarkForm] = useState({ date: "", remark: "" });

    // Mock Lists for Dropdowns
    const recruitersList = ["Pooja", "Sneha", "Khushi Chawla", "Amit Kumar", "Rahul"];
    const slotsList = [
        "09:30 AM - 01:00 PM", 
        "02:00 PM - 06:00 PM", 
        "Full Day (10-6)", 
        "Urgent (Immediate)"
    ];

    // --- MOCK DATA (Sourced from CRM assignments) ---
    // Added tlRemarks array to store the added remarks
    const [assignments, setAssignments] = useState([
        { 
            id: 1, date: "2026-03-02", client: "Frankfin", profile: "Telecouncellor", package: "30k", requirement: "350", 
            recruiter: "Pooja", slot: "09:30 AM - 01:00 PM", isFinalAssigned: true, tlRemarks: [],
            progress: { cv_naukri: 45, cv_indeed: 20, cv_other: 5, totalCv: 70, advance_sti: 15, today_conversion: 2, today_asset: 5, tracker_sent: 1, notes: "Good response today. Client was happy with the first batch of profiles." } 
        },
        { 
            id: 2, date: "2026-03-02", client: "Urban Money", profile: "Telesales Executive", package: "21k", requirement: "30", 
            recruiter: "Sneha", slot: "", isFinalAssigned: false, tlRemarks: [],
            progress: { cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0, advance_sti: 0, today_conversion: 0, today_asset: 0, tracker_sent: 0, notes: "" } 
        },
        { 
            id: 3, date: "2026-03-02", client: "Urban Money", profile: "Telesales Executive", package: "21k", requirement: "30", 
            recruiter: "Khushi Chawla", slot: "Full Day (10-6)", isFinalAssigned: true, tlRemarks: [],
            progress: { cv_naukri: 20, cv_indeed: 10, cv_other: 2, totalCv: 32, advance_sti: 5, today_conversion: 1, today_asset: 3, tracker_sent: 1, notes: "1 conversion done. Need to parse more data from Indeed for backup." } 
        },
        { 
            id: 4, date: "2026-03-02", client: "Steel Craft Export", profile: "Senior Merchandiser", package: "70k", requirement: "2", 
            recruiter: "Sneha", slot: "Full Day (10-6)", isFinalAssigned: true, tlRemarks: [],
            progress: { cv_naukri: 5, cv_indeed: 5, cv_other: 0, totalCv: 10, advance_sti: 2, today_conversion: 0, today_asset: 1, tracker_sent: 1, notes: "Very niche profile. Searching for local candidates with exact industry experience." } 
        },
        { 
            id: 5, date: "2026-03-03", client: "MKS", profile: "AutoCAD", package: "40k", requirement: "2", 
            recruiter: "", slot: "", isFinalAssigned: false, tlRemarks: [],
            progress: { cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0, advance_sti: 0, today_conversion: 0, today_asset: 0, tracker_sent: 0, notes: "" } 
        }
    ]);

    // --- HANDLERS ---
    
    // Update dropdown fields
    const handleRowChange = (id, field, value) => {
        setAssignments(prev => 
            prev.map(item => item.id === id ? { ...item, [field]: value, isFinalAssigned: false } : item)
        );
    };

    // Individual Assign Button Handler
    const handleIndividualAssign = (item) => {
        if (!item.recruiter || !item.slot) {
            alert("Please select both Recruiter and Slot Timings before assigning.");
            return;
        }
        
        setAssignments(prev => 
            prev.map(a => a.id === item.id ? { ...a, isFinalAssigned: true } : a)
        );
        alert(`Task assigned to ${item.recruiter} successfully!`);
    };

    // View Work Modal Handlers
    const handleViewWork = (item) => {
        setSelectedWork(item);
        setIsViewModalOpen(true);
    };

    // Add Remark Modal Handlers
    const handleOpenRemarkModal = (item) => {
        setSelectedRemarkTask(item);
        // Set today's date automatically
        const today = new Date().toISOString().split('T')[0];
        setRemarkForm({ date: today, remark: "" });
        setIsRemarkModalOpen(true);
    };

    const handleCloseRemarkModal = () => {
        setIsRemarkModalOpen(false);
        setSelectedRemarkTask(null);
    };

    const handleSaveRemark = () => {
        if(!remarkForm.date || !remarkForm.remark) {
            alert("Please fill both Date and Remark.");
            return;
        }

        setAssignments(prev => prev.map(a => {
            if (a.id === selectedRemarkTask.id) {
                const existingRemarks = a.tlRemarks || [];
                return { 
                    ...a, 
                    tlRemarks: [...existingRemarks, { date: remarkForm.date, text: remarkForm.remark }] 
                };
            }
            return a;
        }));

        handleCloseRemarkModal();
        alert("Remark added successfully!");
    };

    // Filter Logic
    const filteredData = assignments.filter(item => 
        item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recruiter.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6">
            
            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <LayoutGrid size={24}/> TL Workbench
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Allocate requirements & track recruiter progress
                    </p>
                </div>
                
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search client, profile, recruiter..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-72 outline-none focus:border-[#103c7f] transition shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* --- WORKBENCH SPREADSHEET TABLE --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar min-h-[50vh]">
                    <table className="w-full text-left border-collapse min-w-[1250px]">
                        
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 border-r border-blue-800 w-10 text-center">#</th>
                                <th className="p-3 border-r border-blue-800 w-28"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Building2 size={12}/> Client</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-3 border-r border-blue-800 text-center w-24"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Package</div></th>
                                <th className="p-3 border-r border-blue-800 text-center w-20"><div className="flex items-center justify-center gap-1.5"><Target size={12}/> Req.</div></th>
                                
                                {/* Editable Columns Headers */}
                                <th className="p-3 border-r border-blue-800 bg-[#0d316a] min-w-[160px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> Assign Recruiter</div></th>
                                <th className="p-3 border-r border-blue-800 bg-[#0d316a] min-w-[160px]"><div className="flex items-center gap-1.5 text-yellow-300"><Clock size={12}/> Slot Timings</div></th>
                                
                                {/* Action Column */}
                                <th className="p-3 bg-[#0d316a] text-center w-40 sticky right-0 z-20">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-200 bg-gray-50">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => {
                                    
                                    return (
                                        <tr key={item.id} className={`transition group ${item.isFinalAssigned ? 'bg-green-50/40' : 'hover:bg-blue-50/30 bg-white'}`}>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center text-gray-400 font-bold">
                                                {item.isFinalAssigned ? <CheckCircle2 size={14} className="text-green-500 mx-auto"/> : (index + 1)}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 font-mono text-gray-600">
                                                {item.date}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 font-black text-[#103c7f]">
                                                {item.client}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 font-bold text-gray-700">
                                                {item.profile}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-600">
                                                {item.package}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center font-black text-[13px] text-gray-800">
                                                {item.requirement}
                                            </td>
                                            
                                            {/* --- EDITABLE COLUMN: RECRUITER --- */}
                                            <td className="p-1 border-r border-gray-200 bg-blue-50/10">
                                                <select 
                                                    className="w-full bg-transparent border-none p-2 text-xs font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:bg-white rounded"
                                                    value={item.recruiter}
                                                    onChange={(e) => handleRowChange(item.id, 'recruiter', e.target.value)}
                                                >
                                                    <option value="" className="text-gray-400">-- Select Recruiter --</option>
                                                    {recruitersList.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            
                                            {/* --- EDITABLE COLUMN: SLOT TIMINGS --- */}
                                            <td className="p-1 border-r border-gray-200 bg-blue-50/10">
                                                <select 
                                                    className="w-full bg-transparent border-none p-2 text-xs font-bold text-purple-700 outline-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:bg-white rounded"
                                                    value={item.slot}
                                                    onChange={(e) => handleRowChange(item.id, 'slot', e.target.value)}
                                                >
                                                    <option value="" className="text-gray-400">-- Select Slot --</option>
                                                    {slotsList.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>

                                            {/* --- ACTION COLUMN --- */}
                                            <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                                                <div className="flex justify-center gap-1.5">
                                                    {/* Assign / Update Button */}
                                                    <button 
                                                        onClick={() => handleIndividualAssign(item)}
                                                        className={`px-2.5 py-1.5 rounded font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider transition ${
                                                            item.isFinalAssigned 
                                                            ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                                                            : 'bg-[#103c7f] text-white hover:bg-blue-900 shadow-sm'
                                                        }`}
                                                        title={item.isFinalAssigned ? "Update Assignment" : "Assign to Recruiter"}
                                                    >
                                                        <Send size={12}/> {item.isFinalAssigned ? 'Update' : 'Assign'}
                                                    </button>

                                                    {/* Add Remark Button */}
                                                    <button 
                                                        onClick={() => handleOpenRemarkModal(item)}
                                                        className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                                                        title="Add TL Remark"
                                                    >
                                                        <MessageSquarePlus size={14}/>
                                                    </button>

                                                    {/* View Work Button (Only visible if assigned) */}
                                                    {item.isFinalAssigned && (
                                                        <button 
                                                            onClick={() => handleViewWork(item)}
                                                            className="p-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded hover:bg-purple-100 transition"
                                                            title="View Work Progress"
                                                        >
                                                            <Activity size={14}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                        </tr>
                                    )
                                })) : (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest bg-white">
                                        No requirements pending for allocation
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD REMARK MODAL --- */}
            {isRemarkModalOpen && selectedRemarkTask && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                <MessageSquarePlus size={18}/> Add TL Remark
                            </h3>
                            <button onClick={handleCloseRemarkModal} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 bg-gray-50">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-5">
                                <p className="text-xs font-bold text-gray-600">Client: <span className="text-[#103c7f]">{selectedRemarkTask.client}</span></p>
                                <p className="text-xs font-bold text-gray-600">Profile: <span className="text-[#103c7f]">{selectedRemarkTask.profile}</span></p>
                            </div>

                            <div className="mb-4">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-[#103c7f] outline-none shadow-sm bg-white"
                                    value={remarkForm.date}
                                    onChange={(e) => setRemarkForm({...remarkForm, date: e.target.value})}
                                />
                            </div>

                            <div className="mb-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Remark / Feedback</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Enter your remarks here..."
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none resize-none shadow-sm bg-white"
                                    value={remarkForm.remark}
                                    onChange={(e) => setRemarkForm({...remarkForm, remark: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCloseRemarkModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition shadow-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveRemark} className="bg-[#103c7f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-900 transition">
                                Save Remark
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW WORK MODAL (TL SIDE) --- */}
            {isViewModalOpen && selectedWork && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                <BarChart2 size={18}/> Recruiter Progress Summary
                            </h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 bg-gray-50 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            
                            {/* Profile Info Banner */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-5 shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="text-lg font-black text-[#103c7f]">{selectedWork.profile}</h4>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                        <Building2 size={12}/> {selectedWork.client}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-[10px] font-black border border-purple-200 block mb-1">
                                        By: {selectedWork.recruiter}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold block">{selectedWork.slot}</span>
                                </div>
                            </div>

                            {/* Detailed Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                
                                {/* Total CVs Card */}
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 col-span-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1.5"><FileText size={14}/> Total CVs Parsed</span>
                                        <span className="text-2xl font-black text-blue-700 leading-none">{selectedWork.progress.totalCv}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 bg-white p-2 rounded border border-blue-50">
                                        <span>Naukri: <span className="text-gray-800">{selectedWork.progress.cv_naukri}</span></span>
                                        <span>Indeed: <span className="text-gray-800">{selectedWork.progress.cv_indeed}</span></span>
                                        <span>Other: <span className="text-gray-800">{selectedWork.progress.cv_other}</span></span>
                                    </div>
                                </div>

                                {/* Advance STI */}
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                    <Send size={16} className="text-purple-500 mb-1"/>
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Advance STI</p>
                                    <p className="text-xl font-black text-purple-700">{selectedWork.progress.advance_sti}</p>
                                </div>

                                {/* Tracker Sent */}
                                <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                    <UserCheck size={16} className="text-gray-500 mb-1"/>
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Tracker Sent</p>
                                    <p className="text-xl font-black text-gray-700">{selectedWork.progress.tracker_sent}</p>
                                </div>

                                {/* Conversion */}
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-[11px] font-black text-green-700 uppercase flex items-center gap-1.5 mb-0.5"><TrendingUp size={14}/> Today Conversion</p>
                                        <p className="text-[10px] font-bold text-gray-500">Target Requirement: {selectedWork.requirement}</p>
                                    </div>
                                    <p className="text-3xl font-black text-green-700">{selectedWork.progress.today_conversion}</p>
                                </div>

                                {/* Asset */}
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-[11px] font-black text-orange-700 uppercase flex items-center gap-1.5 mb-0.5"><Database size={14}/> Today Asset</p>
                                        <p className="text-[10px] font-bold text-gray-500">Assets built today</p>
                                    </div>
                                    <p className="text-3xl font-black text-orange-600">{selectedWork.progress.today_asset}</p>
                                </div>

                            </div>

                            {/* Recruiter & TL Notes Section */}
                            <div className="space-y-4">
                                {/* Recruiter Notes */}
                                {selectedWork.progress.notes && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                            <FileText size={12}/> Recruiter's Daily Note
                                        </h5>
                                        <p className="text-sm font-medium text-gray-700 italic border-l-2 border-yellow-400 pl-3 py-1 bg-yellow-50/30">
                                            "{selectedWork.progress.notes}"
                                        </p>
                                    </div>
                                )}

                                {/* TL Remarks History */}
                                {selectedWork.tlRemarks && selectedWork.tlRemarks.length > 0 && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm">
                                        <h5 className="text-[10px] font-black text-[#103c7f] uppercase mb-3 flex items-center gap-1.5 border-b border-blue-100 pb-2">
                                            <MessageSquarePlus size={12}/> TL Remarks History
                                        </h5>
                                        <div className="space-y-3 pl-1">
                                            {selectedWork.tlRemarks.map((rem, i) => (
                                                <div key={i} className="relative pl-4 border-l-2 border-blue-400">
                                                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5 border border-white"></div>
                                                    <p className="text-[9px] font-bold text-gray-500 mb-0.5">{rem.date}</p>
                                                    <p className="text-xs font-medium text-gray-800">{rem.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white text-right">
                            <button onClick={() => setIsViewModalOpen(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition shadow-sm">
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}