"use client";
import { useState } from "react";
import { 
    ClipboardList, Calendar, Users, Briefcase, IndianRupee, 
    Target, Plus, Trash2, Search, Edit, Activity, X, 
    BarChart2, FileText, Send, UserCheck, TrendingUp, Database, 
    MessageSquarePlus, Building2, Clock
} from "lucide-react";

export default function AssignWorkPage() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    
    // View Work Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState(null);

    // Mock Lists for Dropdowns
    const clientsList = ["Frankfin", "Urban Money", "Steel Craft Export", "MKS", "TechCorp Solutions"];
    const tlList = ["Gurmeet", "Shruti", "Rohan", "Amit"];
    const profilesList = ["Telecouncellor", "Telesales Executive", "Senior Merchandiser", "AutoCAD", "Java Developer"];

    // Initial Form State
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const initialForm = {
        date: getTodayDate(),
        client: "",
        profile: "",
        package_salary: "",
        requirement: "",
        tl_assigned: ""
    };
    const [formData, setFormData] = useState(initialForm);

    // --- MOCK TABLE DATA ---
    // Added mock downstream data (recruiter, progress, tlRemarks) to simulate work already started
    const [assignments, setAssignments] = useState([
        { 
            id: 1, date: "2026-03-02", client: "Frankfin", profile: "Telecouncellor", package_salary: "30k", requirement: "350", tl_assigned: "Gurmeet",
            recruiter: "Pooja", slot: "09:30 AM - 01:00 PM", 
            progress: { cv_naukri: 45, cv_indeed: 20, cv_other: 5, totalCv: 70, advance_sti: 15, today_conversion: 2, today_asset: 5, tracker_sent: 1, notes: "Good response today. Client was happy with the first batch of profiles." },
            tlRemarks: [{ date: "2026-03-03", text: "Asked Pooja to focus only on immediate joiners." }]
        },
        { 
            id: 2, date: "2026-03-02", client: "Urban Money", profile: "Telesales Executive", package_salary: "21k", requirement: "30", tl_assigned: "Gurmeet",
            recruiter: "", slot: "", progress: null, tlRemarks: []
        },
        { 
            id: 3, date: "2026-03-02", client: "Urban Money", profile: "Telesales Executive", package_salary: "21k", requirement: "30", tl_assigned: "Shruti",
            recruiter: "Khushi Chawla", slot: "Full Day (10-6)", 
            progress: { cv_naukri: 20, cv_indeed: 10, cv_other: 2, totalCv: 32, advance_sti: 5, today_conversion: 1, today_asset: 3, tracker_sent: 1, notes: "1 conversion done. Need to parse more data from Indeed for backup." },
            tlRemarks: []
        }
    ]);

    // --- HANDLERS ---
    const handleAddOrUpdate = () => {
        if (!formData.client || !formData.profile || !formData.tl_assigned || !formData.requirement) {
            alert("Please fill all mandatory fields (Client, Profile, Requirement, TL)!");
            return;
        }

        if (isEditMode) {
            setAssignments(assignments.map(item => item.id === editId ? { ...item, ...formData } : item));
            setIsEditMode(false);
            setEditId(null);
            alert("Assignment updated successfully!");
        } else {
            const newAssignment = {
                ...formData,
                id: Date.now(),
                recruiter: "", slot: "", progress: null, tlRemarks: [] // Initialize empty downstream data
            };
            setAssignments([newAssignment, ...assignments]);
            alert("Assignment created successfully!");
        }
        
        setFormData({ ...initialForm, date: formData.date });
    };

    const handleEdit = (item) => {
        setFormData({
            date: item.date,
            client: item.client,
            profile: item.profile,
            package_salary: item.package_salary,
            requirement: item.requirement,
            tl_assigned: item.tl_assigned
        });
        setIsEditMode(true);
        setEditId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top form
    };

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this assignment?")) {
            setAssignments(assignments.filter(item => item.id !== id));
        }
    };

    const handleViewWork = (item) => {
        setSelectedWork(item);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredData = assignments.filter(item => 
        item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tl_assigned.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6">
            
            {/* HEADER */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <ClipboardList size={24}/> Requirement Allocation Panel
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Assign Clients & Requirements to Team Leads
                    </p>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search assignments..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-72 outline-none focus:border-[#103c7f] transition shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* --- QUICK ASSIGN / EDIT FORM --- */}
            <div className={`bg-white p-4 rounded-xl border shadow-sm mb-6 relative overflow-hidden transition-all ${isEditMode ? 'border-orange-300 shadow-orange-100' : 'border-blue-200'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${isEditMode ? 'bg-orange-500' : 'bg-[#103c7f]'}`}></div>
                
                <div className="flex justify-between items-center mb-3">
                    <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${isEditMode ? 'text-orange-600' : 'text-[#103c7f]'}`}>
                        {isEditMode ? <><Edit size={14}/> Edit Assignment</> : <><Plus size={14}/> Create New Assignment</>}
                    </h3>
                    {isEditMode && (
                        <button 
                            onClick={() => { setIsEditMode(false); setFormData(initialForm); }} 
                            className="text-[10px] text-gray-500 hover:text-gray-800 font-bold uppercase underline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap lg:flex-nowrap gap-3 items-end">
                    
                    {/* Date */}
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    {/* Client Dropdown */}
                    <div className="flex-[2] min-w-[180px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Client Name</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm bg-white"
                            value={formData.client}
                            onChange={(e) => setFormData({...formData, client: e.target.value})}
                        >
                            <option value="">Select Client...</option>
                            {clientsList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Profile Dropdown / Datalist */}
                    <div className="flex-[2] min-w-[180px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Profile</label>
                        <input 
                            list="profiles"
                            placeholder="Type or select profile"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.profile}
                            onChange={(e) => setFormData({...formData, profile: e.target.value})}
                        />
                        <datalist id="profiles">
                            {profilesList.map(p => <option key={p} value={p}/>)}
                        </datalist>
                    </div>

                    {/* Package */}
                    <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Package</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 30k"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.package_salary}
                            onChange={(e) => setFormData({...formData, package_salary: e.target.value})}
                        />
                    </div>

                    {/* Requirement Number */}
                    <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Requirement</label>
                        <input 
                            type="number" 
                            placeholder="Count"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.requirement}
                            onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                        />
                    </div>

                    {/* TL Dropdown */}
                    <div className="flex-[1.5] min-w-[150px]">
                        <label className="text-[10px] font-bold text-[#103c7f] uppercase block mb-1">Assign To TL</label>
                        <select 
                            className="w-full border border-[#103c7f] rounded-lg p-2 text-sm font-black text-[#103c7f] bg-blue-50 focus:border-blue-800 outline-none shadow-sm"
                            value={formData.tl_assigned}
                            onChange={(e) => setFormData({...formData, tl_assigned: e.target.value})}
                        >
                            <option value="">Select TL...</option>
                            {tlList.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button 
                            onClick={handleAddOrUpdate}
                            className={`text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition flex items-center gap-2 h-[38px] ${isEditMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#103c7f] hover:bg-blue-900'}`}
                        >
                            {isEditMode ? <><Edit size={16}/> Update</> : <><Plus size={16}/> Assign</>}
                        </button>
                    </div>

                </div>
            </div>

            {/* --- ASSIGNMENTS TABLE --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-r border-blue-800 w-12 text-center">#</th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Building2 size={12}/> Client</div></th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Package</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Target size={12}/> Requirement</div></th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Users size={12}/> TL Assigned</div></th>
                                <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-100">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition">
                                    
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-400 font-bold">
                                        {index + 1}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100 font-mono text-gray-600">
                                        {item.date}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100 font-black">
                                        {item.client}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100">
                                        {item.profile}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100 text-center font-bold text-green-700 bg-green-50/20">
                                        {item.package_salary}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100 text-center font-black text-lg text-[#103c7f]">
                                        {item.requirement}
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100">
                                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                            {item.tl_assigned}
                                        </span>
                                    </td>
                                    
                                    <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-center items-center gap-1.5">
                                            {/* Edit Button */}
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition"
                                                title="Edit Assignment"
                                            >
                                                <Edit size={14} />
                                            </button>

                                            {/* View Work Button */}
                                            <button 
                                                onClick={() => handleViewWork(item)}
                                                className="p-1.5 text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
                                                title="View Downstream Progress"
                                            >
                                                <Activity size={14} />
                                            </button>

                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition"
                                                title="Delete Assignment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))) : (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest">
                                        No assignments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- VIEW WORK MODAL (CRM SIDE) --- */}
            {isViewModalOpen && selectedWork && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                <BarChart2 size={18}/> Assignment Progress Summary
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
                                        <Building2 size={12}/> {selectedWork.client} | Req: {selectedWork.requirement}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Team Lead</p>
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-[10px] font-black border border-purple-200 block mt-1">
                                        {selectedWork.tl_assigned}
                                    </span>
                                </div>
                            </div>

                            {selectedWork.progress ? (
                                <>
                                    {/* Sub-assignment Info */}
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                                            <Users size={14} className="text-blue-600"/> Assigned Recruiter: <span className="text-gray-900">{selectedWork.recruiter}</span>
                                        </p>
                                        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                                            <Clock size={14} className="text-orange-500"/> Slot: <span className="text-gray-900">{selectedWork.slot}</span>
                                        </p>
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
                                            </div>
                                            <p className="text-3xl font-black text-green-700">{selectedWork.progress.today_conversion}</p>
                                        </div>

                                        {/* Asset */}
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                            <div className="text-left">
                                                <p className="text-[11px] font-black text-orange-700 uppercase flex items-center gap-1.5 mb-0.5"><Database size={14}/> Today Asset</p>
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
                                </>
                            ) : (
                                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-sm font-bold text-gray-500">No progress logged by the team yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Check back later after the recruiter updates their workbench.</p>
                                </div>
                            )}

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