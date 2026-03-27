"use client";
import { useState, useMemo } from "react";
import { 
    Building2, History, Calendar, X, FileText, 
    MapPin, GraduationCap, Eye, Mail, CheckCircle2, 
    Clock, Users, UserCheck, AlertCircle, Briefcase, XCircle
} from "lucide-react";

export default function EmailHistoryPage() {
    // --- STATE ---
    const [selectedClient, setSelectedClient] = useState("All");
    const [modalType, setModalType] = useState(null); // 'view_journey' or null
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // --- MOCK DATA: EMAIL HISTORY & JOURNEY ---
    // In a real app, this would come from your backend/database
    const mockData = [
        {
            id: 1,
            dateShared: "27-Mar-2026",
            clientCompany: "TechNova Solutions",
            name: "Rahul Verma",
            profile: "B2B Sales Executive",
            location: "Gurugram, HR",
            qualification: "MBA Marketing",
            experience: "5 Years",
            tlCvName: "Rahul_Verma_Redacted.pdf",
            currentStatus: "Shortlisted", 
            crmFeedback: "Profile shared with HR via bulk email.", 
            journey: [
                { id: 101, status: "Tracker Shared", date: "2026-03-27", remark: "Profile shared with HR via bulk email." },
                { id: 102, status: "Shortlisted", date: "2026-03-28", remark: "Client liked the portfolio. L1 pending." }
            ]
        },
        {
            id: 2,
            dateShared: "25-Mar-2026",
            clientCompany: "TechNova Solutions",
            name: "Anjali Sharma",
            profile: "React Developer",
            location: "Noida, UP",
            qualification: "B.Tech CS",
            experience: "3.5 Years",
            tlCvName: "Anjali_Sharma_Redacted.pdf",
            currentStatus: "Interviewed",
            crmFeedback: "Direct mail sent to Tech Lead.",
            journey: [
                { id: 201, status: "Tracker Shared", date: "2026-03-25", remark: "Direct mail sent to Tech Lead." },
                { id: 202, status: "Interviewed", date: "2026-03-27", remark: "Cleared L1 technical round." }
            ]
        },
        {
            id: 3,
            dateShared: "27-Mar-2026",
            clientCompany: "Global Innovators",
            name: "Sunil Yadav",
            profile: "Backend Developer",
            location: "Pune, MH",
            qualification: "MCA",
            experience: "4 Years",
            tlCvName: "Sunil_Yadav_Redacted.pdf",
            currentStatus: "Pipeline",
            crmFeedback: "Included in the weekly tracker.",
            journey: [
                { id: 301, status: "Tracker Shared", date: "2026-03-27", remark: "Included in the weekly tracker." },
                { id: 302, status: "Pipeline", date: "2026-03-29", remark: "Client asked to hold for next quarter." }
            ]
        },
        {
            id: 4,
            dateShared: "20-Mar-2026",
            clientCompany: "NextGen Startups",
            name: "Priya Singh",
            profile: "UI/UX Designer",
            location: "Bangalore, MH",
            qualification: "B.Des",
            experience: "2 Years",
            tlCvName: "Priya_Singh_Redacted.pdf",
            currentStatus: "Joining",
            crmFeedback: "Portfolio shared with founder.",
            journey: [
                { id: 401, status: "Tracker Shared", date: "2026-03-20", remark: "Portfolio shared with founder." },
                { id: 402, status: "Shortlisted", date: "2026-03-21", remark: "Design task given." },
                { id: 403, status: "Interviewed", date: "2026-03-23", remark: "Task reviewed. Final round done." },
                { id: 404, status: "Joining", date: "2026-03-26", remark: "Offer rolled out and accepted." }
            ]
        },
        {
            id: 5,
            dateShared: "15-Mar-2026",
            clientCompany: "Global Innovators",
            name: "Amit Kumar",
            profile: "Data Analyst",
            location: "Delhi",
            qualification: "B.Sc Stats",
            experience: "1 Year",
            tlCvName: "Amit_Kumar_Redacted.pdf",
            currentStatus: "Ghosted",
            crmFeedback: "Shared with hiring manager.",
            journey: [
                { id: 501, status: "Tracker Shared", date: "2026-03-15", remark: "Shared with hiring manager." },
                { id: 502, status: "Ghosted", date: "2026-03-27", remark: "No reply after 3 follow-ups." }
            ]
        },
        {
            id: 6,
            dateShared: "10-Mar-2026",
            clientCompany: "Apex Corp",
            name: "Sonia Bajaj",
            profile: "HR Executive",
            location: "Mumbai",
            qualification: "MBA HR",
            experience: "2.5 Years",
            tlCvName: "Sonia_Bajaj_Redacted.pdf",
            currentStatus: "Rejected",
            crmFeedback: "Shared profile for open HR position.",
            journey: [
                { id: 601, status: "Tracker Shared", date: "2026-03-10", remark: "Shared profile for open HR position." },
                { id: 602, status: "Rejected", date: "2026-03-14", remark: "Budget constraints, rejected." }
            ]
        }
    ];

    // --- EXTRACT UNIQUE COMPANIES FOR FILTER ---
    const clientCompanies = [...new Set(mockData.map(item => item.clientCompany))];

    // --- FILTER DATA BASED ON DROPDOWN ---
    const filteredData = useMemo(() => {
        if (selectedClient === "All") return mockData;
        return mockData.filter(row => row.clientCompany === selectedClient);
    }, [selectedClient, mockData]);

    // --- CALCULATE DYNAMIC KPIs ---
    const kpiCounts = useMemo(() => {
        return {
            shared: filteredData.length, // Total rows in the filtered list
            shortlisted: filteredData.filter(d => d.currentStatus === 'Shortlisted').length,
            interviewed: filteredData.filter(d => d.currentStatus === 'Interviewed').length,       
            joining: filteredData.filter(d => d.currentStatus === 'Joining').length,
            pipeline: filteredData.filter(d => d.currentStatus === 'Pipeline').length,
            ghosted: filteredData.filter(d => d.currentStatus === 'Ghosted').length,
            rejected: filteredData.filter(d => d.currentStatus === 'Rejected').length, // New KPI added here
        };
    }, [filteredData]);

    // --- HANDLERS ---
    const openViewJourneyModal = (candidateRow) => {
        setSelectedCandidate(candidateRow);
        setModalType('view_journey');
    };

    const getStatusBadge = (status) => {
        if (status === 'Shortlisted') return 'bg-blue-50 text-blue-600 border-blue-200';
        if (status === 'Interviewed') return 'bg-amber-50 text-amber-600 border-amber-200';
        if (status === 'Joining') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (status === 'Pipeline') return 'bg-purple-50 text-purple-600 border-purple-200';
        if (status === 'Ghosted') return 'bg-rose-50 text-rose-600 border-rose-200';
        if (status === 'Rejected') return 'bg-red-50 text-red-600 border-red-200'; // Red badge for rejected
        return 'bg-slate-50 text-slate-600 border-slate-200'; // Default / Tracker Shared
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={18} />
                    </div>
                    Client Email History
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 xl:ml-10">
                    Track CV Submissions & Candidate Interview Journeys
                </p>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full max-w-md">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                        <Building2 size={14} className="inline mr-1 mb-0.5 text-indigo-500"/> Select Client:
                    </label>
                    <select 
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                        value={selectedClient} 
                        onChange={(e) => setSelectedClient(e.target.value)}
                    >
                        <option value="All">All Clients (Overall View)</option>
                        <optgroup label="Specific Companies">
                            {clientCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* --- DYNAMIC KPI CARDS --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
                <KpiCard title="Tracker Shared" count={kpiCounts.shared} icon={<Mail size={16}/>} color="indigo" />
                <KpiCard title="Shortlisted" count={kpiCounts.shortlisted} icon={<UserCheck size={16}/>} color="blue" />
                <KpiCard title="Interviewed" count={kpiCounts.interviewed} icon={<Users size={16}/>} color="amber" />
                <KpiCard title="Joining" count={kpiCounts.joining} icon={<CheckCircle2 size={16}/>} color="emerald" />
                <KpiCard title="Pipeline" count={kpiCounts.pipeline} icon={<Clock size={16}/>} color="purple" />
                <KpiCard title="Ghosted / No Reply" count={kpiCounts.ghosted} icon={<AlertCircle size={16}/>} color="rose" />
                <KpiCard title="Rejected" count={kpiCounts.rejected} icon={<XCircle size={16}/>} color="red" />
            </div>

            {/* --- MAIN EMAIL HISTORY TABLE --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto custom-scrollbar min-h-[50vh] pb-4">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1300px]">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900 text-white">
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Client Company</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Candidate</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Profile & Location</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Experience</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest max-w-[200px] border-b border-slate-700">Initial Email Feedback</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-700">CV File</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-700">Current Status</th>
                                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest bg-indigo-900/50 sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)] text-center border-l border-b border-slate-700 w-32">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        
                                        {/* Company & Date */}
                                        <td className="py-3 px-4 border-r border-slate-50 bg-slate-50/30">
                                            <p className="text-xs font-black text-indigo-700">{row.clientCompany}</p>
                                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                                                <Calendar size={10} className="text-indigo-400"/> Shared: {row.dateShared}
                                            </p>
                                        </td>

                                        {/* Candidate Details */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-black text-slate-800">{row.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                                                <GraduationCap size={10} className="text-slate-400"/> {row.qualification}
                                            </p>
                                        </td>

                                        {/* Profile & Location */}
                                        <td className="py-3 px-4">
                                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest block w-max mb-1.5">
                                                {row.profile}
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                                <MapPin size={10} className="text-slate-400"/> {row.location}
                                            </p>
                                        </td>

                                        {/* Experience */}
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-black text-slate-800">{row.experience}</p>
                                        </td>

                                        {/* CRM Feedback (Email Note) */}
                                        <td className="py-3 px-4 max-w-[200px] whitespace-normal">
                                            <p className="text-[10px] font-medium text-slate-600 italic leading-snug border-l-2 border-indigo-300 pl-2">
                                                "{row.crmFeedback}"
                                            </p>
                                        </td>

                                        {/* CV Link */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-indigo-600 hover:text-indigo-800 cursor-pointer" title={row.tlCvName}>
                                                <FileText size={14}/>
                                                <span className="text-[10px] font-black truncate w-24 block text-left">
                                                    {row.tlCvName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Current Status Badge */}
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border inline-block ${getStatusBadge(row.currentStatus)}`}>
                                                {row.currentStatus}
                                            </span>
                                        </td>

                                        {/* Action Button (Sticky Right) */}
                                        <td className="py-3 px-4 sticky right-0 bg-white transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-32">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => openViewJourneyModal(row)}
                                                    className="w-full py-2 px-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                >
                                                    <Eye size={12}/> View Journey
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center">
                                        <History size={32} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No email history found for the selected client.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL: VIEW JOURNEY TIMELINE */}
            {/* ========================================================= */}
            {modalType === 'view_journey' && selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[500px] overflow-hidden flex flex-col border-4 border-white animate-in zoom-in-95">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16}/> Interview Journey
                                </h2>
                                <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">
                                    {selectedCandidate.name} • {selectedCandidate.clientCompany}
                                </p>
                            </div>
                            <button onClick={() => setModalType(null)} className="hover:text-slate-300 bg-white/10 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                        </div>

                        {/* Modal Body (Scrollable Timeline) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                            {selectedCandidate.journey && selectedCandidate.journey.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedCandidate.journey.map((step) => (
                                        <div key={step.id} className="relative pl-6 border-l-2 border-indigo-200 pb-2 last:border-l-0 last:pb-0">
                                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                                            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm -mt-2 hover:border-indigo-300 transition-colors">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">{step.status}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {step.date}</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-600 italic leading-snug">"{step.remark}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center flex flex-col items-center justify-center h-full">
                                    <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-500">No updates yet.</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Journey tracking will appear here.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Current Status Footer */}
                        <div className="bg-white border-t border-slate-100 p-3 text-center shrink-0 flex items-center justify-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(selectedCandidate.currentStatus)}`}>
                                {selectedCandidate.currentStatus}
                            </span>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

// --- HELPER COMPONENT: KPI CARD ---
function KpiCard({ title, count, icon, color }) {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        rose: "bg-rose-50 text-rose-700 border-rose-100",
        red: "bg-red-50 text-red-700 border-red-100",
    };

    const activeColor = colorClasses[color] || colorClasses.indigo;

    return (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
            </div>
            <div className="flex items-end justify-between mt-1 pl-1">
                <h3 className="text-2xl font-black text-slate-800 leading-none">{count}</h3>
            </div>
        </div>
    );
}