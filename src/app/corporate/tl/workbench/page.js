"use client";
import { useState, useEffect } from "react";
import {
    ClipboardList, Calendar, Users, Briefcase, IndianRupee,
    Target, Search, Activity, X, BarChart2, FileText, Send,
    UserCheck, TrendingUp, Database, MessageSquarePlus, Clock, Eye, Download, Edit
} from "lucide-react";

export default function TLWorkbenchPage() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [rcUsersList, setRcUsersList] = useState([]);
    const [loadingRcUsers, setLoadingRcUsers] = useState(true);
    
    // View Work Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState(null);

    // JD View Modal State (PDF Style)
    const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
    const [currentJdView, setCurrentJdView] = useState(null);

    // Add Remark Modal State
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkTask, setSelectedRemarkTask] = useState(null);
    const [remarkForm, setRemarkForm] = useState({ remark: "" });
    const [savingRemark, setSavingRemark] = useState(false);

    // Slots List
    const slotsList = [
        "10:00 - 11:30",
        "12:00 - 01:30",
        "02:00 - 03:30",
        "Other"
    ];

    // Fetch RC users on component mount
    useEffect(() => {
        const fetchRcUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/corporate/tl/rc-users', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setRcUsersList(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch RC users:', error);
            } finally {
                setLoadingRcUsers(false);
            }
        };
        fetchRcUsers();
    }, []);

    // Fetch workbench assignments on component mount
    useEffect(() => {
        const fetchWorkbenchAssignments = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/corporate/tl/workbench', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    // Transform workbench data to match assignments format
                    const transformedAssignments = data.data.map(item => ({
                        id: item.id,
                        date: item.date,
                        profile: item.job_title,
                        package_salary: item.package || '',
                        requirement: item.requirement?.toString() || '',
                        jd: {
                            title: item.job_title,
                            summary: item.job_summary || '',
                            skills: item.req_skills || '',
                            location: item.location || '',
                            experience: item.experience || '',
                            employment_type: item.employment_type || '',
                            working_days: item.working_days || '',
                            timings: item.timings || '',
                            package_salary: item.package || '',
                            tool_requirement: item.tool_requirement || '',
                            rnr: item.rnr || '',
                            preferred_qual: item.preferred_qual || '',
                            company_offers: item.company_offers || '',
                            contact_details: item.contact_details || ''
                        },
                        recruiter: item.recruiter_name || '',
                        slot: item.slot || '',
                        isFinalAssigned: !!item.sent_to_rc,
                        tl_remarks: item.tl_remarks || null,
                        rc_remarks: item.rc_remarks || null,
                        advance_sti: item.advance_sti || '',
                        tracker_sent: item.tracker_sent || 0,
                        today_asset: item.today_asset || 0,
                        today_conversion: item.today_conversion || 0,
                        cv_naukri: item.cv_naukri || 0,
                        cv_indeed: item.cv_indeed || 0,
                        cv_other: item.cv_other || 0,
                        totalCv: item.totalCv || 0,
                        tlRemarks: [],
                        progress: { cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0, advance_sti: 0, today_conversion: 0, today_asset: 0, tracker_sent: 0, notes: '' }
                    }));
                    setAssignments(transformedAssignments);
                }
            } catch (error) {
                console.error('Failed to fetch workbench assignments:', error);
            } finally {
                setLoadingAssignments(false);
            }
        };
        fetchWorkbenchAssignments();
    }, []);

    // --- HANDLERS ---
    
    // Update dropdown fields in table
    const handleRowChange = (id, field, value) => {
        setAssignments(prev => 
            prev.map(item => item.id === id ? { ...item, [field]: value, isFinalAssigned: false } : item)
        );
    };

    // Individual Assign Button Handler
    const handleIndividualAssign = async (item) => {
        if (!item.recruiter || !item.slot) {
            alert("Please select both Recruiter and Slot Timings before assigning.");
            return;
        }

        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            
            // Find the selected RC user to get their user_id
            const selectedRc = rcUsersList.find(rc => rc.name === item.recruiter);
            
            if (!selectedRc) {
                alert("Selected recruiter not found. Please try again.");
                return;
            }

            const response = await fetch('/api/corporate/tl/workbench/assign', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workbench_id: item.id,
                    sent_to_rc: selectedRc.user_id,
                    slot: item.slot
                })
            });

            const data = await response.json();

            if (data.success) {
                setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, isFinalAssigned: true } : a));
                alert(`Task assigned to ${item.recruiter} successfully!`);
            } else {
                alert(`Failed to assign task: ${data.error}`);
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            alert("Failed to assign task. Please try again.");
        }
    };

    // Modals
    const handleViewWork = (item) => {
        setSelectedWork(item);
        setIsViewModalOpen(true);
    };

    const handleOpenRemarkModal = (item) => {
        setSelectedRemarkTask(item);
        setRemarkForm({ remark: item.tl_remarks || "" });
        setIsRemarkModalOpen(true);
    };

    const handleCloseRemarkModal = () => {
        setIsRemarkModalOpen(false);
        setSelectedRemarkTask(null);
    };

    const handleSaveRemark = async () => {
        if(!remarkForm.remark) {
            alert("Please enter a remark.");
            return;
        }

        setSavingRemark(true);

        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            
            const response = await fetch('/api/corporate/tl/workbench/remark', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workbench_id: selectedRemarkTask.id,
                    tl_remark: remarkForm.remark
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state with the new remark
                setAssignments(prev => prev.map(a => {
                    if (a.id === selectedRemarkTask.id) {
                        const existingRemarks = a.tlRemarks || [];
                        return { ...a, tlRemarks: [...existingRemarks, { date: new Date().toISOString().split('T')[0], text: remarkForm.remark }] };
                    }
                    return a;
                }));
                handleCloseRemarkModal();
                alert("Remark added successfully!");
            } else {
                alert(`Failed to add remark: ${data.error}`);
            }
        } catch (error) {
            console.error('Error saving remark:', error);
            alert('Failed to add remark. Please try again.');
        } finally {
            setSavingRemark(false);
        }
    };

    // Filter Logic
    const filteredData = assignments.filter(item => 
        item.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recruiter.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6 relative">
            
            {/* HEADER & SEARCH */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <ClipboardList size={24}/> TL Workbench
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Allocate CRM requirements & track recruiter progress
                    </p>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search profile, recruiter..." 
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
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 border-r border-blue-800 w-10 text-center">#</th>
                                <th className="p-3 border-r border-blue-800 w-28"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-3 border-r border-blue-800 text-center w-24"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Package</div></th>
                                <th className="p-3 border-r border-blue-800 text-center w-20"><div className="flex items-center justify-center gap-1.5"><Target size={12}/> Req.</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> JD</div></th>
                                
                                {/* Editable Columns Headers */}
                                <th className="p-3 border-r border-blue-800 bg-[#0d316a] min-w-[160px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> Assign Recruiter</div></th>
                                <th className="p-3 border-r border-blue-800 bg-[#0d316a] min-w-[160px]"><div className="flex items-center gap-1.5 text-yellow-300"><Clock size={12}/> Slot Timings</div></th>
                                
                                {/* Action Column */}
                                <th className="p-3 bg-[#0d316a] text-center w-32 sticky right-0 z-20">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-200 bg-gray-50">
                            {loadingAssignments ? (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest bg-white">
                                        Loading assignments...
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => {
                                    
                                    return (
                                        <tr key={item.id} className={`transition group ${item.isFinalAssigned ? 'bg-green-50/40' : 'hover:bg-blue-50/30 bg-white'}`}>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center text-gray-400 font-bold">
                                                {index + 1}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 font-mono text-gray-600">
                                                {item.date}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 font-black text-[#103c7f]">
                                                {item.profile}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center font-bold text-green-700 bg-green-50/20">
                                                {item.package_salary}
                                            </td>
                                            
                                            <td className="p-2 border-r border-gray-200 text-center font-black text-[13px] text-gray-800">
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
                                            
                                            {/* --- EDITABLE COLUMN: RECRUITER --- */}
                                            <td className="p-1 border-r border-gray-200 bg-blue-50/10">
                                                <select
                                                    className="w-full bg-transparent border-none p-2 text-xs font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:bg-white rounded"
                                                    value={item.recruiter}
                                                    onChange={(e) => handleRowChange(item.id, 'recruiter', e.target.value)}
                                                    disabled={loadingRcUsers}
                                                >
                                                    <option value="" className="text-gray-400">{loadingRcUsers ? "Loading..." : "-- Select Recruiter --"}</option>
                                                    {rcUsersList.map(rc => <option key={rc.user_id} value={rc.name}>{rc.name}</option>)}
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
                                                <div className="flex justify-center items-center gap-1.5">
                                                    {/* Assign / Assigned Button */}
                                                    {item.isFinalAssigned && item.slot ? (
                                                        <span className="px-2.5 py-1.5 rounded font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                                                            <Send size={12}/> Assigned
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleIndividualAssign(item)}
                                                            className="px-2.5 py-1.5 rounded font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider transition bg-[#103c7f] text-white hover:bg-blue-900 shadow-sm"
                                                            title="Assign to Recruiter"
                                                        >
                                                            <Send size={12}/> Assign
                                                        </button>
                                                    )}

                                                    {/* Add/Edit Remark Button */}
                                                    <button 
                                                        onClick={() => handleOpenRemarkModal(item)}
                                                        className={`p-1.5 border rounded hover:bg-blue-100 transition ${
                                                            item.tl_remarks 
                                                            ? 'bg-yellow-50 text-yellow-600 border-yellow-200' 
                                                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        }`}
                                                        title={item.tl_remarks ? "Edit TL Remark" : "Add TL Remark"}
                                                    >
                                                        {item.tl_remarks ? <Edit size={14}/> : <MessageSquarePlus size={14}/>}
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
                                        No workbench assignments found
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
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                {selectedRemarkTask?.tl_remarks ? <Edit size={18}/> : <MessageSquarePlus size={18}/>} {selectedRemarkTask?.tl_remarks ? 'Edit TL Remark' : 'Add TL Remark'}
                            </h3>
                            <button onClick={handleCloseRemarkModal} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-5">
                                <p className="text-xs font-bold text-gray-600">Profile: <span className="text-[#103c7f]">{selectedRemarkTask.profile}</span></p>
                                <p className="text-xs font-bold text-gray-600">Recruiter: <span className="text-[#103c7f]">{selectedRemarkTask.recruiter || "Not Assigned"}</span></p>
                            </div>
                            <div className="mb-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Remark / Feedback</label>
                                <textarea rows="4" placeholder="Enter your remarks here..." className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none resize-none shadow-sm bg-white" value={remarkForm.remark} onChange={(e) => setRemarkForm({...remarkForm, remark: e.target.value})}></textarea>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCloseRemarkModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition shadow-sm">Cancel</button>
                            <button onClick={handleSaveRemark} disabled={savingRemark} className="bg-[#103c7f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {savingRemark ? 'Saving...' : 'Save Remark'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW WORK MODAL (TL SIDE) --- */}
            {isViewModalOpen && selectedWork && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2"><BarChart2 size={18}/> Recruiter Progress Summary</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10"><X size={20} /></button>
                        </div>
                        <div className="p-6 bg-gray-50 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            
                            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-5 shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="text-lg font-black text-[#103c7f]">{selectedWork.profile}</h4>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                        <Target size={12}/> Req: {selectedWork.requirement}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-[10px] font-black border border-purple-200 block mb-1">By RC: {selectedWork.recruiter}</span>
                                    <span className="text-[10px] text-gray-400 font-bold block">{selectedWork.slot}</span>
                                </div>
                            </div>

                            {selectedWork.progress ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 col-span-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1.5"><FileText size={14}/> Total CVs Parsed</span>
                                                <span className="text-2xl font-black text-blue-700 leading-none">{selectedWork.totalCv}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-gray-500 bg-white p-2 rounded border border-blue-50">
                                                <span>Naukri: <span className="text-gray-800">{selectedWork.cv_naukri}</span></span>
                                                <span>Indeed: <span className="text-gray-800">{selectedWork.cv_indeed}</span></span>
                                                <span>Other: <span className="text-gray-800">{selectedWork.cv_other}</span></span>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                            <Send size={16} className="text-purple-500 mb-1"/>
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Advance STI</p>
                                            <p className="text-xl font-black text-purple-700">{selectedWork.advance_sti || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                            <UserCheck size={16} className="text-gray-500 mb-1"/>
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Tracker Sent</p>
                                            <p className="text-xl font-black text-gray-700">{selectedWork.tracker_sent}</p>
                                        </div>
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                            <div className="text-left"><p className="text-[11px] font-black text-green-700 uppercase flex items-center gap-1.5 mb-0.5"><TrendingUp size={14}/> Today Conversion</p></div>
                                            <p className="text-3xl font-black text-green-700">{selectedWork.today_conversion}</p>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                            <div className="text-left"><p className="text-[11px] font-black text-orange-700 uppercase flex items-center gap-1.5 mb-0.5"><Database size={14}/> Today Asset</p></div>
                                            <p className="text-3xl font-black text-orange-600">{selectedWork.today_asset}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {selectedWork.progress.notes && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-1.5"><FileText size={12}/> Recruiter's Daily Note</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-yellow-400 pl-3 py-1 bg-yellow-50/30">"{selectedWork.progress.notes}"</p>
                                            </div>
                                        )}
                                        {selectedWork.tlRemarks && selectedWork.tlRemarks.length > 0 && (
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-[#103c7f] uppercase mb-3 flex items-center gap-1.5 border-b border-blue-100 pb-2"><MessageSquarePlus size={12}/> TL Remarks History</h5>
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
                                        {selectedWork.rc_remarks && (
                                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 shadow-sm w-full mt-4">
                                                <h5 className="text-[10px] font-black text-purple-700 uppercase mb-3 flex items-center gap-1.5 border-b border-purple-100 pb-2"><MessageSquarePlus size={12}/> RC Remarks</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-purple-400 pl-3 py-1 bg-purple-50/30">{selectedWork.rc_remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-sm font-bold text-gray-500">No progress logged by the recruiter yet.</p>
                                </div>
                            )}

                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white text-right">
                            <button onClick={() => setIsViewModalOpen(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition shadow-sm">Close View</button>
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
                                                    {currentJdView.skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
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