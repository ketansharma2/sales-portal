"use client";
import { useState } from "react";
import { 
    Search, Calendar, User, Briefcase, Building2, Clock, 
    MessageSquarePlus, History, CheckCircle, X, AlertCircle, 
    UserCheck, UserMinus, PhoneCall
} from "lucide-react";

export default function CandidateFollowupPanel() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(""); // 'add', 'view'
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // --- MOCK DATA: Candidates assigned to this Recruiter ---
    const [candidates, setCandidates] = useState([
        {
            id: 1,
            name: "Rohan Das",
            client: "TechCorp Solutions",
            position: "Java Developer",
            doj: "15 Jan 2026",
            status: "Working", // Joined, Working, Absconded, Resigned, Notice Period
            nextFollowup: "15 Mar 2026",
            history: [
                { id: 101, date: "02 Mar 2026", remarks: "Candidate has successfully completed 1 month. Received first salary. Client feedback is positive.", nextDate: "15 Mar 2026", loggedBy: "Amit Kumar (Recruiter)" },
                { id: 102, date: "20 Feb 2026", remarks: "15-day check-in. Candidate is adapting well to the project.", nextDate: "02 Mar 2026", loggedBy: "Amit Kumar (Recruiter)" }
            ]
        },
        {
            id: 2,
            name: "Priya Sharma",
            client: "Global Logistics",
            position: "HR Manager",
            doj: "01 Feb 2026",
            status: "Warning", 
            nextFollowup: "06 Mar 2026",
            history: [
                { id: 201, date: "03 Mar 2026", remarks: "Candidate is complaining about the work culture and late sitting hours. Trying to retain.", nextDate: "06 Mar 2026", loggedBy: "Amit Kumar (Recruiter)" },
                { id: 202, date: "15 Feb 2026", remarks: "First 15 days completed. A bit struggling with the software but managing.", nextDate: "03 Mar 2026", loggedBy: "Amit Kumar (Recruiter)" }
            ]
        },
        {
            id: 3,
            name: "Vikas Verma",
            client: "Lakshya International School",
            position: "Mathematics Teacher",
            doj: "25 Feb 2026",
            status: "Absconded",
            nextFollowup: "-",
            history: [
                { id: 301, date: "01 Mar 2026", remarks: "Did not report to the school for the last 3 days. Not picking up calls. Marked as Absconded.", nextDate: "-", loggedBy: "Amit Kumar (Recruiter)" },
                { id: 302, date: "25 Feb 2026", remarks: "Day 1 check-in. Successfully joined and took the first class.", nextDate: "01 Mar 2026", loggedBy: "Amit Kumar (Recruiter)" }
            ]
        }
    ]);

    // Form State for Adding Followup
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const initialForm = { date: getTodayDate(), remarks: "", nextDate: "", status: "" };
    const [formData, setFormData] = useState(initialForm);

    // --- HANDLERS ---
    const handleOpenModal = (type, candidate) => {
        setModalType(type);
        setSelectedCandidate(candidate);
        if (type === 'add') {
            setFormData({ ...initialForm, status: candidate.status });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
    };

    const handleSaveFollowup = () => {
        if (!formData.remarks || !formData.nextDate) return alert("Please fill all details!");

        const updatedCandidates = candidates.map(c => {
            if (c.id === selectedCandidate.id) {
                return {
                    ...c,
                    status: formData.status,
                    nextFollowup: formData.nextDate,
                    history: [
                        {
                            id: Date.now(),
                            date: formData.date,
                            remarks: formData.remarks,
                            nextDate: formData.nextDate,
                            loggedBy: "Amit Kumar (You)" // Auto pick logged in user
                        },
                        ...c.history
                    ]
                };
            }
            return c;
        });

        setCandidates(updatedCandidates);
        handleCloseModal();
    };

    // Filter logic
    const filteredCandidates = candidates.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.client.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HELPER FOR STATUS BADGE ---
    const getStatusBadge = (status) => {
        switch(status) {
            case 'Working': return <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><UserCheck size={12}/> Working</span>;
            case 'Warning': return <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><AlertCircle size={12}/> At Risk</span>;
            case 'Absconded': return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><UserMinus size={12}/> Absconded</span>;
            case 'Resigned': return <span className="bg-gray-100 text-gray-600 border border-gray-300 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><UserMinus size={12}/> Resigned</span>;
            default: return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><User size={12}/> {status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2">
            
            {/* HEADER & STATS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <PhoneCall size={24}/> Candidate Retention & Follow-up
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Track post-joining status & feedback</p>
                </div>
                
                
            </div>

            {/* SEARCH */}
            <div className="mb-4">
                <div className="relative inline-block">
                    <input 
                        type="text" 
                        placeholder="Search Candidate or Client..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-72 outline-none focus:border-[#103c7f] transition shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-r border-blue-800">Candidate Info</th>
                                <th className="p-4 border-r border-blue-800">Client Account</th>
                                <th className="p-4 border-r border-blue-800 text-center">Date of Joining</th>
                                <th className="p-4 border-r border-blue-800 text-center">Current Status</th>
                                <th className="p-4 border-r border-blue-800 text-center">Next Follow-up</th>
                                <th className="p-4 text-center bg-[#0d316a] sticky right-0 z-20 w-36">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-blue-50/20 transition group">
                                    
                                    {/* Candidate */}
                                    <td className="p-3 border-r border-gray-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-[#103c7f] text-sm flex items-center gap-1.5"><User size={14}/> {candidate.name}</span>
                                            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5"><Briefcase size={12}/> {candidate.position}</span>
                                        </div>
                                    </td>

                                    {/* Client */}
                                    <td className="p-3 border-r border-gray-100 font-bold text-gray-800">
                                        <div className="flex items-center gap-1.5"><Building2 size={14} className="text-gray-400"/> {candidate.client}</div>
                                    </td>

                                    {/* DOJ */}
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        <span className="inline-flex items-center gap-1.5 font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                            <Calendar size={12} className="text-[#103c7f]"/> {candidate.doj}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        <div className="flex justify-center">
                                            {getStatusBadge(candidate.status)}
                                        </div>
                                    </td>

                                    {/* Next Followup */}
                                    <td className="p-3 border-r border-gray-100 text-center">
                                        {candidate.nextFollowup !== "-" ? (
                                            <span className="inline-flex items-center gap-1.5 font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                <Clock size={12}/> {candidate.nextFollowup}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 font-bold">-</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleOpenModal('add', candidate)}
                                                className="p-1.5 text-white bg-purple-600 rounded transition hover:bg-purple-700 shadow-sm" 
                                                title="Log New Follow-up"
                                            >
                                                <MessageSquarePlus size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleOpenModal('view', candidate)}
                                                className="p-1.5 text-purple-600 bg-purple-50 border border-purple-200 rounded transition hover:bg-purple-100" 
                                                title="View History"
                                            >
                                                <History size={14} />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))) : (
                                <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest">No candidates found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALS --- */}
            {isModalOpen && selectedCandidate && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="bg-purple-700 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2">
                                {modalType === 'add' ? <><MessageSquarePlus size={18}/> Log Candidate Follow-up</> : <><History size={18}/> Follow-up Timeline</>}
                            </h3>
                            <button onClick={handleCloseModal} className="hover:bg-white/20 p-1.5 rounded-full transition bg-white/10"><X size={20} /></button>
                        </div>

                       {/* --- ADD FOLLOWUP MODAL --- */}
                        {modalType === 'add' && (
                            <div className="p-6">
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-5 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-lg font-black text-purple-800">{selectedCandidate.name}</h4>
                                        <p className="text-xs font-bold text-gray-600 mt-0.5"><Briefcase size={10} className="inline mr-1"/>{selectedCandidate.position} | <Building2 size={10} className="inline mr-1"/>{selectedCandidate.client}</p>
                                    </div>
                                    {getStatusBadge(selectedCandidate.status)}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-5">
                                    {/* 1. Follow-up Date */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Follow-up Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-purple-600 outline-none"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>

                                    {/* Empty div for grid spacing on desktop */}
                                    <div className="hidden md:block"></div>

                                    {/* 2. Remarks / Conversation */}
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Conversation / Remarks</label>
                                        <textarea 
                                            rows="4" 
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-purple-600 outline-none resize-none" 
                                            placeholder="E.g., Called candidate to check work experience. Everything is fine. Will check again next week."
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                        ></textarea>
                                    </div>

                                    {/* 3. Next Follow-up Date */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Next Follow-up Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-purple-600 outline-none"
                                            value={formData.nextDate}
                                            onChange={(e) => setFormData({...formData, nextDate: e.target.value})}
                                        />
                                    </div>

                                    {/* 4. Status */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Current Status</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-purple-600 outline-none bg-white"
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        >
                                            <option value="Working">Working</option>
                                            <option value="Warning">Warning</option>
                                            <option value="Absconded">Absconded</option>
                                            <option value="Resigned">Resigned</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                                    <button onClick={handleSaveFollowup} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-purple-700 transition flex items-center gap-2">
                                        <CheckCircle size={16}/> Save & Update
                                    </button>
                                </div>
                            </div>
                        )}

                       {/* --- VIEW HISTORY MODAL --- */}
                        {modalType === 'view' && (
                            <div className="p-6 bg-gray-50">
                                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                                    <div>
                                        <h4 className="text-xl font-black text-purple-800">{selectedCandidate.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedCandidate.position} at {selectedCandidate.client}</p>
                                    </div>
                                    {getStatusBadge(selectedCandidate.status)}
                                </div>

                                <div className="space-y-6 pl-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-3">
                                    {selectedCandidate.history.map((hist, idx) => (
                                        <div key={hist.id} className={`relative pl-6 border-l-2 ${idx === 0 ? 'border-purple-600' : 'border-purple-300'}`}>
                                            <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 border-4 shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-purple-600 border-white' : 'bg-purple-400 border-gray-50 w-3 h-3 -left-[7px] top-1'}`}></div>
                                            
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Follow-up Date: <span className="text-gray-800">{hist.date}</span></p>
                                                
                                                {/* Dinamically change badge color based on who logged it */}
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                                    hist.loggedBy.includes("Team Lead") || hist.loggedBy.includes("TL") 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                    : 'bg-purple-100 text-purple-800 border-purple-200'
                                                }`}>
                                                    By: {hist.loggedBy}
                                                </span>
                                            </div>
                                            
                                            <p className={`text-sm font-bold text-gray-800 p-3 rounded-lg shadow-sm border ${idx === 0 ? 'bg-white border-gray-200' : 'bg-white/60 border-gray-100'}`}>
                                                {hist.remarks}
                                            </p>

                                            {hist.nextDate !== "-" && (
                                                <p className="text-xs text-purple-600 font-bold flex items-center gap-1.5 mt-2">
                                                    <Calendar size={12}/> Next Follow-up: {hist.nextDate}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* MOCK DATA: TL's Old Entry Example (Appended statically for UI demonstration if needed, or you can rely on the dynamic map above if you added TL to the mock state array) */}
                                    <div className="relative pl-6 border-l-2 border-transparent">
                                        <div className="absolute w-3 h-3 bg-gray-400 rounded-full -left-[7px] top-1 border-2 border-gray-50"></div>
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Follow-up Date: <span className="text-gray-800">Day 1</span></p>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-200">By: Shruti (Team Lead)</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-600 bg-gray-100 p-3 rounded-lg border border-gray-200">
                                            Candidate successfully completed onboarding and logged into the client system. Handed over to Recruiter for weekly tracking.
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-6 text-right pt-4 border-t border-gray-200">
                                    <button onClick={handleCloseModal} className="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-sm">Close View</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}