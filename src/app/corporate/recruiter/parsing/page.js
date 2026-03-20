"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Added router for navigation
import { 
    UploadCloud, FileText, Search, Calendar, MapPin, 
    Loader2, History, File, CheckCircle2, X
} from "lucide-react";

export default function CVParsingPage() {
    const router = useRouter(); // Initialize router

    // --- STATE ---
    const [isParsing, setIsParsing] = useState(false);
    
    // Sirf CV view karne ke liye ek modal state rakha hai
    const [cvModalOpen, setCvModalOpen] = useState(false); 
    const [selectedCandidateCV, setSelectedCandidateCV] = useState(null);

    // --- MOCK PARSED DATA ---
    const [parsedData, setParsedData] = useState([
        {
            id: 1,
            portal: "Naukri",
            portalDate: "09-Mar-2026",
            name: "Anjali Sharma",
            email: "anjali.sharma@email.com",
            mobile: "+91 9876543210",
            location: "Noida, UP",
            gender: "Female",
            qualification: "B.Tech (Computer Science)",
            experience: "3.5 Years",
            topSkills: "React.js, Node.js",
            recentCompany: "TechSolutions Pvt Ltd",
            collegeName: "Amity University",
            allSkills: "React.js, Node.js, Express, MongoDB, JavaScript, TypeScript, Tailwind, Git, AWS",
            allCompanies: "TechSolutions Pvt Ltd, Intern at WebMakers",
            status: "Pending"
        },
        {
            id: 2,
            portal: "LinkedIn",
            portalDate: "08-Mar-2026",
            name: "Vikas Kumar",
            email: "vikas.k@email.com",
            mobile: "+91 9988776655",
            location: "Delhi, India",
            gender: "Male",
            qualification: "BCA",
            experience: "2 Years",
            topSkills: "HTML, CSS, JS",
            recentCompany: "WebDev Agency",
            collegeName: "Delhi University",
            allSkills: "HTML, CSS, JS, React, Tailwind",
            allCompanies: "WebDev Agency",
            status: "Shortlisted"
        }
    ]);

    // --- HANDLERS ---
    const handleUploadClick = () => {
        setIsParsing(true);
        setTimeout(() => {
            const newMockRow = {
                id: parsedData.length + 1,
                portal: "Foundit",
                portalDate: "09-Mar-2026",
                name: "Rahul Verma",
                email: "rahul.v@email.com",
                mobile: "+91 9123456789",
                location: "Gurugram, HR",
                gender: "Male",
                qualification: "MBA (Marketing)",
                experience: "5 Years",
                topSkills: "B2B Sales, Lead Gen",
                recentCompany: "Global Sales Corp",
                collegeName: "Delhi University",
                allSkills: "B2B Sales, Lead Generation, CRM Management, Negotiation",
                allCompanies: "Global Sales Corp, FreshStart Inc",
                status: "Pending"
            };
            setParsedData([newMockRow, ...parsedData]);
            setIsParsing(false);
        }, 1500);
    };

    // NAVIGATE TO NEW PAGE ON ROW/BUTTON CLICK
    const navigateToHistory = (candidateId) => {
        // Redirects to /recruiter/candidate-history/[id]
        router.push(`/corporate/recruiter/candidate-history/${candidateId}`);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 relative">
            
         {/* --- COMPACT HEADER & UPLOAD SECTION (SINGLE ROW) --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6 flex flex-col xl:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Left: Header Info */}
                <div className="shrink-0 flex flex-col items-center xl:items-start text-center xl:text-left">
                    <h1 className="text-xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <UploadCloud size={18} />
                        </div>
                        CV Parsing Engine
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-0 xl:ml-10">
                        Auto-Extract Resumes & Process
                    </p>
                </div>

                {/* Right: Tools (Drag & Drop + Settings) */}
                <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-4 xl:justify-end">
                    
                    {/* Compact Dropzone */}
                    <div className="w-full sm:max-w-md border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-2.5 flex items-center justify-between gap-4 transition-colors hover:bg-blue-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                <FileText size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">Drop CV Here</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">(PDF/DOC)</p>
                            </div>
                        </div>
                        <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:border-blue-300 hover:text-blue-600 transition-colors">
                            Browse
                        </button>
                    </div>

                    {/* Source Dropdown */}
                    <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option>Naukri</option>
                        <option>Indeed</option>
                        <option>Maven</option>
                        <option>Other</option>
                    </select>

                    {/* Parse Button */}
                    <button 
                        onClick={handleUploadClick}
                        disabled={isParsing}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                    >
                        {isParsing ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14} />}
                        {isParsing ? "Extracting..." : "Parse CV"}
                    </button>

                </div>

            </div>

           {/* --- PARSED DATA TABLE --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500"/> Parsed Candidates Queue
                    </h3>
                    <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                        Total Parsed: {parsedData.length}
                    </span>
                </div>

                {/* Wrapper div for both Vertical and Horizontal scrolling */}
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar pb-4 relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1700px]">
                        
                        {/* Sticky Header */}
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-white border-b-2 border-slate-100">
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-16 text-center">CV</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Info</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Details</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location / Gender</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualification</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience / Company</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Skills</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">All Skills & Companies</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky right-0 bg-slate-50 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center border-l border-slate-200 w-28">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {parsedData.map((row) => (
                                <tr 
                                    key={row.id} 
                                    onClick={() => navigateToHistory(row.id)} // Clicking ROW redirects to new page
                                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                >
                                    
                                    {/* 1. CV View Button (Sticky Left) */}
                                    <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); // Prevents row click
                                                setSelectedCandidateCV(row);
                                                setCvModalOpen(true); 
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center mx-auto transition-colors"
                                            title="View Original CV"
                                        >
                                            <File size={14} />
                                        </button>
                                    </td>

                                    {/* 2 & 3. Portal & Portal Date */}
                                    <td className="py-3 px-4">
                                        <p className="text-[11px] font-black text-[#103c7f] uppercase">{row.portal}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">{row.portalDate}</p>
                                    </td>

                                    {/* 4, 5 & 6. Name, Email, Mobile */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-black text-slate-800">{row.name}</p>
                                        <div className="flex flex-col text-[10px] text-slate-500 font-bold mt-0.5 gap-0.5">
                                            <span className="flex items-center gap-1"><Search size={9}/> {row.mobile}</span>
                                            <span className="lowercase text-blue-500">{row.email}</span>
                                        </div>
                                    </td>

                                    {/* 7 & 8. Location & Gender */}
                                    <td className="py-3 px-4">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin size={10} className="text-slate-400"/>{row.location}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{row.gender}</p>
                                    </td>

                                    {/* 9 & 13. Qualification & College */}
                                    <td className="py-3 px-4">
                                        <p className="text-[11px] font-black text-slate-700">{row.qualification}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5 max-w-[150px] truncate" title={row.collegeName}>{row.collegeName}</p>
                                    </td>

                                    {/* 10 & 12. Experience & Recent Company */}
                                    <td className="py-3 px-4">
                                        <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">{row.experience}</span>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1.5 max-w-[150px] truncate" title={row.recentCompany}>{row.recentCompany}</p>
                                    </td>

                                    {/* 11. Top Skills */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {row.topSkills.split(',').map((skill, i) => (
                                                <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">{skill.trim()}</span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* 14 & 15. All Skills & All Companies (Truncated) */}
                                    <td className="py-3 px-4 max-w-[200px]">
                                        <div className="text-[9px] font-bold text-slate-400 mb-1 truncate" title={row.allSkills}>
                                            <span className="text-slate-600">Skills:</span> {row.allSkills}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 truncate" title={row.allCompanies}>
                                            <span className="text-slate-600">Comps:</span> {row.allCompanies}
                                        </div>
                                    </td>

                                    {/* 16. Action (History Button) */}
                                    <td className="py-3 px-4 sticky right-0 bg-slate-50 group-hover:bg-blue-50 transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-28">
                                        <div className="flex items-center justify-center">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); // Prevents double firing since row is also clickable
                                                    navigateToHistory(row.id); 
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-[#103c7f] text-white rounded hover:bg-blue-900 transition-colors font-black text-[10px] uppercase tracking-widest shadow-sm"
                                            >
                                                <History size={12} /> History
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ONLY ONE MODAL LEFT: Dummy View CV Modal */}
            {cvModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText size={18}/> Original Resume: {selectedCandidateCV?.name}
                            </h2>
                            <button onClick={() => setCvModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-8">
                            <div className="text-center text-slate-500">
                                <File size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-black uppercase tracking-widest mb-1">PDF Viewer Placeholder</p>
                                <p className="text-xs font-bold">The uploaded document will be rendered here via iframe or PDF.js</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}