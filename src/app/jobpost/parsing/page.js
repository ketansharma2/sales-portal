"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import {
    UploadCloud, FileText, Search, Calendar, MapPin,
    Loader2, History, File, CheckCircle2, X, AlertCircle, User, MessageSquare
} from "lucide-react";

// CV Preview Component - Handles PDF, Images, and Word documents
function CVPreview({ url, name }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileType, setFileType] = useState(null);

    useEffect(() => {
        const fetchFileAsBlob = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch file: ${response.status}`);
                }
                
                const blob = await response.blob();
                
                let detectedType = blob.type;
                if (blob.type === 'binary/octet-stream' || blob.type === 'application/octet-stream') {
                    const arrayBuffer = await blob.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
                    const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    if (header.startsWith('25504446')) {
                        detectedType = 'application/pdf';
                    }
                    else if (header.startsWith('89504e47')) {
                        detectedType = 'image/png';
                    }
                    else if (header.startsWith('ffd8ff')) {
                        detectedType = 'image/jpeg';
                    }
                    else if (header.startsWith('504b')) {
                        detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }
                }
                setFileType(detectedType);
                
                if (detectedType.startsWith('image/')) {
                    const img = new Image();
                    const imgUrl = URL.createObjectURL(blob);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = imgUrl;
                    });
                    
                    const orientation = img.width > img.height ? 'landscape' : 'portrait';
                    const pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'px',
                        format: [img.width, img.height]
                    });
                    
                    pdf.addImage(imgUrl, 'JPEG', 0, 0, img.width, img.height);
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    setBlobUrl(pdfUrl);
                } else if (detectedType === 'application/pdf') {
                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                    const fileBlobUrl = URL.createObjectURL(pdfBlob);
                    setBlobUrl(fileBlobUrl);
                } else {
                    const fileBlobUrl = URL.createObjectURL(blob);
                    setBlobUrl(fileBlobUrl);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching file:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (url) {
            fetchFileAsBlob();
        }

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [url]);

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="ml-3 text-sm font-bold text-slate-500">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-slate-500 p-4">
                <File size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-black uppercase tracking-widest mb-1">Error Loading File</p>
                <p className="text-xs font-bold">{error}</p>
                <button
                    onClick={() => window.open(url, '_blank')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                >
                    Open in New Tab
                </button>
            </div>
        );
    }

    const isImage = fileType && fileType.startsWith('image/');
    const isWord = fileType === 'application/msword' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isImage) {
        return (
            <iframe
                src={blobUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`CV Image: ${name}`}
            />
        );
    }

    if (isWord) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-lg p-4">
                <FileText size={64} className="text-blue-500 mb-4" />
                <p className="text-sm font-bold text-slate-700 mb-2">Word Document</p>
                <p className="text-xs text-slate-500 mb-4 text-center">
                    Preview not available for Word documents.<br/>Please download to view.
                </p>
                <a 
                    href={url} 
                    download={name + '_CV.docx'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                    Download CV
                </a>
            </div>
        );
    }

    return (
        <iframe
            src={blobUrl}
            className="w-full h-full border-0 rounded-lg"
            title={`CV Preview: ${name}`}
        />
    );
}

// --- DUMMY DATA ---
const DUMMY_DB_DATA = [
    {
        id: "1", portal: "Naukri", portal_date: "2026-04-18T10:00:00Z", name: "Rahul Sharma", email: "rahul.s@example.com",
        mobile: "9876543210", location: "Delhi NCR", gender: "Male", qualification: "B.Tech Computer Science",
        experience: 4, top_skills: "React, Node.js", recent_company: "Tech Corp", college_name: "Delhi University",
        skills_all: "React, Node.js, AWS", company_names_all: "Tech Corp", status: "Pending", cv_url: null,
        is_shared: false, latest_status: "Shortlisted", latest_user: "Gurmeet", latest_date: "19 Apr 2026"
    },
    {
        id: "2", portal: "Indeed", portal_date: "2026-04-17T12:30:00Z", name: "Priya Singh", email: "priya.singh@test.com",
        mobile: "9998887776", location: "Bangalore", gender: "Female", qualification: "MBA",
        experience: 6, top_skills: "Sales, Marketing", recent_company: "Salesforce", college_name: "IIM B",
        skills_all: "Sales, Marketing, B2B", company_names_all: "Salesforce, Oracle", status: "Pending", cv_url: null,
        is_shared: true, latest_status: "Interview", latest_user: "Admin", latest_date: "18 Apr 2026"
    }
];

const DUMMY_PARSE_RESULT = {
    Name: "Amit Verma",
    "Email ID": "amit.v@mockdomain.com",
    "Mobile No": "9998887776",
    Location: "Gurgaon",
    Gender: "Male",
    "Highest Qualification": "MCA",
    "Years of Experience": "3",
    "Top Skills": "Next.js, Tailwind, Supabase",
    "Recent Company": "Web Solutions",
    "College Name": "MDU",
    Skills: "Next.js, Tailwind, Supabase, React, Git",
    "Company Names": "Web Solutions",
    "Latest Designation": "Frontend Engineer"
};

export default function CVParsingPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    // --- STATE ---
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedPortal, setSelectedPortal] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    const [cvModalOpen, setCvModalOpen] = useState(false);
    const [selectedCandidateCV, setSelectedCandidateCV] = useState(null);
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [parsedCandidateName, setParsedCandidateName] = useState("");
    const [parsedDataForModal, setParsedDataForModal] = useState(null);
    const [editableData, setEditableData] = useState(null);
    
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [duplicateData, setDuplicateData] = useState(null);
    const [isAddingToParsing, setIsAddingToParsing] = useState(false);

    // --- PARSED DATA ---
    const [parsedData, setParsedData] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const statusOptions = ["Shortlisted", "Conversion", "Asset", "Not Picked", "Not Interested", "Interview", "Not In Service", "Other"];

    const filteredParsedData = useMemo(() => {
        let filtered = parsedData;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(row => 
                row.name?.toLowerCase().includes(query) ||
                row.email?.toLowerCase().includes(query) ||
                row.mobile?.includes(query)
            );
        }
        
        if (statusFilter) {
            filtered = filtered.filter(row => row.latest_status === statusFilter);
        }
        
        if (fromDate) {
            const from = new Date(fromDate);
            filtered = filtered.filter(row => {
                if (!row.portal_date) return true;
                const rowDate = new Date(row.portal_date);
                return !isNaN(rowDate) && rowDate >= from;
            });
        }
        
        if (toDate) {
            const to = new Date(toDate);
            filtered = filtered.filter(row => {
                if (!row.portal_date) return true;
                const rowDate = new Date(row.portal_date);
                return !isNaN(rowDate) && rowDate <= to;
            });
        }
        
        return filtered;
    }, [parsedData, statusFilter, fromDate, toDate, searchQuery]);

    // MOCK: Fetch initial data
    useEffect(() => {
        fetchCVParsingData();
    }, []);

    const fetchCVParsingData = () => {
        setIsLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            const transformedData = DUMMY_DB_DATA.map(item => ({
                id: item.id,
                portal: item.portal,
                portal_date: item.portal_date,
                portalDate: new Date(item.portal_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                name: item.name,
                email: item.email,
                mobile: item.mobile,
                location: item.location,
                gender: item.gender,
                qualification: item.qualification,
                experience: `${item.experience} years`,
                topSkills: item.top_skills,
                recentCompany: item.recent_company,
                collegeName: item.college_name,
                allSkills: item.skills_all,
                allCompanies: item.company_names_all,
                status: item.status,
                cvUrl: item.cv_url,
                is_shared: item.is_shared,
                latest_status: item.latest_status,
                latest_user: item.latest_user,
                latest_date: item.latest_date
            }));
            setParsedData(transformedData);
            setIsLoading(false);
        }, 800);
    };

    // --- HANDLERS ---
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadClick = () => {
        if (!selectedFile) return alert("Please select a file first");
        
        const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!supportedTypes.includes(selectedFile.type)) {
            return alert("File type not supported!");
        }

        if (!selectedPortal) return alert("Please select a portal first");

        setIsParsing(true);

        // MOCK: Simulate parsing process
        setTimeout(() => {
            const parsed = DUMMY_PARSE_RESULT; // Use mock result
            setParsedCandidateName(parsed.Name);
            setParsedDataForModal(parsed);
            const today = new Date().toISOString().split('T')[0];
            
            setEditableData({
                portal: selectedPortal,
                portalDate: today,
                name: parsed.Name,
                email: parsed["Email ID"],
                mobile: parsed["Mobile No"],
                location: parsed.Location,
                gender: parsed.Gender,
                qualification: parsed["Highest Qualification"],
                experience: parsed["Years of Experience"],
                topSkills: parsed["Top Skills"],
                recentCompany: parsed["Recent Company"],
                collegeName: parsed["College Name"],
                allSkills: parsed.Skills,
                allCompanies: parsed["Company Names"],
                designation: parsed["Latest Designation"]
            });
            
            setIsParsing(false);
            setSuccessModalOpen(true);
        }, 1500);
    };

    const handleSaveToDatabase = () => {
        if (!editableData) return;
        setIsSaving(true);

        // MOCK: Simulate database save and state update
        setTimeout(() => {
            // Create a new mock row based on the edited data
            const newRow = {
                id: Date.now().toString(),
                portal: editableData.portal,
                portal_date: new Date().toISOString(),
                portalDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                name: editableData.name,
                email: editableData.email,
                mobile: editableData.mobile,
                location: editableData.location,
                gender: editableData.gender,
                qualification: editableData.qualification,
                experience: `${editableData.experience} years`,
                topSkills: editableData.topSkills,
                recentCompany: editableData.recentCompany,
                collegeName: editableData.collegeName,
                allSkills: editableData.allSkills,
                allCompanies: editableData.allCompanies,
                status: "Pending",
                cvUrl: null,
                is_shared: false,
                latest_status: "-",
                latest_user: "-",
                latest_date: "-"
            };

            // Add to top of the table
            setParsedData(prev => [newRow, ...prev]);
            
            setSuccessModalOpen(false);
            setEditableData(null);
            setSelectedFile(null);
            setIsSaving(false);
            alert("Data saved successfully! (Mock)");
        }, 1000);
    };

    const handleEditableChange = (field, value) => {
        setEditableData(prev => ({ ...prev, [field]: value }));
    };

    const navigateToHistory = (candidateId) => {
        router.push(`/jobpost/parsing/history/${candidateId}`);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-2 relative">
            
         {/* --- COMPACT HEADER & UPLOAD SECTION --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6 flex flex-col xl:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-500">
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

                <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-4 xl:justify-end">
                    {/* Compact Dropzone */}
                    <div
                        onClick={handleBrowseClick}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-100'); }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100'); }}
                        onDrop={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100');
                            const file = e.dataTransfer.files?.[0];
                            if (file) setSelectedFile(file);
                        }}
                        className="w-full sm:max-w-md border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-2.5 flex items-center justify-between gap-4 transition-colors hover:bg-blue-50 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                <FileText size={16} />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none truncate">
                                    {selectedFile ? selectedFile.name : "Drop CV Here"}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">
                                    {selectedFile ? formatFileSize(selectedFile.size) : "(PDF/DOC/IMG)"}
                                </p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer">
                            Browse
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                    </div>

                    {/* Source Dropdown */}
                    <select value={selectedPortal} onChange={(e) => setSelectedPortal(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="">Select Portal</option>
                        <option value="Naukri">Naukri</option>
                        <option value="Indeed">Indeed</option>
                        <option value="Maven">Maven</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* Parse Button */}
                    <button onClick={handleUploadClick} disabled={isParsing || !selectedFile || !selectedPortal} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0">
                        {isParsing ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14} />}
                        {isParsing ? "Extracting..." : "Parse CV"}
                    </button>
                </div>
            </div>

           {/* --- PARSED DATA TABLE --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <span className="ml-3 text-sm font-bold text-slate-500">Loading CV data...</span>
                    </div>
                ) : (
                    <>
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500"/> Parsed Candidates Queue
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Search size={12} className="text-slate-400"/>
                                    <input type="text" placeholder="Search name/email/mobile" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-40" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400"/>
                                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" />
                                </div>
                                <span className="text-slate-400 text-xs">to</span>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" />
                                <select className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">All Status</option>
                                    {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                                <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                                    Total: {filteredParsedData.length} / {parsedData.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar pb-4 relative">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-white border-b-2 border-slate-100">
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-16 text-center">CV</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Status</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Info</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Details</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-40">Location / Gender</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualification</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience / Company</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Skills</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">All Skills & Companies</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky right-0 bg-slate-50 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center border-l border-slate-200 w-28">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredParsedData.map((row) => (
                                        <tr key={row.id} onClick={() => navigateToHistory(row.id)} className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${row.is_shared ? 'bg-blue-100' : ''}`}>
                                            <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center">
                                                <button onClick={(e) => { e.stopPropagation(); if (row.cvUrl) { setSelectedCandidateCV(row); setCvModalOpen(true); } else { alert("No CV available for this candidate"); } }} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center mx-auto transition-colors" title={row.cvUrl ? "View Original CV" : "No CV Available"}>
                                                    <File size={14} />
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase">{row.latest_status || '-'}</span>
                                                    <span className="text-[9px] font-medium text-slate-500 mt-0.5">{row.latest_user || '-'}</span>
                                                    <span className="text-[8px] font-medium text-slate-400 mt-0.5">{row.latest_date || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-[11px] font-black text-[#103c7f] uppercase">{row.portal}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{row.portalDate}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-xs font-black text-slate-800">{row.name}</p>
                                                <div className="flex flex-col text-[10px] text-slate-500 font-bold mt-0.5 gap-0.5">
                                                    <span className="flex items-center gap-1"><Search size={9}/> {row.mobile}</span>
                                                    <span className="lowercase text-blue-500">{row.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 max-w-40">
                                                <p className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate" title={row.location}><MapPin size={10} className="text-slate-400 shrink-0"/>{row.location}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{row.gender}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-[11px] font-black text-slate-700">{row.qualification}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 max-w-[150px] truncate" title={row.collegeName}>{row.collegeName}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">{row.experience}</span>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1.5 max-w-[150px] truncate" title={row.recentCompany}>{row.recentCompany}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {row.topSkills?.split(',').map((skill, i) => (
                                                        <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">{skill.trim()}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 max-w-[200px]">
                                                <div className="text-[9px] font-bold text-slate-400 mb-1 truncate" title={row.allSkills}><span className="text-slate-600">Skills:</span> {row.allSkills}</div>
                                                <div className="text-[9px] font-bold text-slate-400 truncate" title={row.allCompanies}><span className="text-slate-600">Comps:</span> {row.allCompanies}</div>
                                            </td>
                                            <td className="py-3 px-4 sticky right-0 bg-slate-50 group-hover:bg-blue-50 transition-colors z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-28">
                                                <div className="flex items-center justify-center">
                                                    <button onClick={(e) => { e.stopPropagation(); navigateToHistory(row.id); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#103c7f] text-white rounded hover:bg-blue-900 transition-colors font-black text-[10px] uppercase tracking-widest shadow-sm">
                                                        <History size={12} /> History
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* CV Preview Modal */}
            {cvModalOpen && selectedCandidateCV && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText size={18}/> Original Resume: {selectedCandidateCV.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                {selectedCandidateCV.cvUrl && (
                                    <a href={selectedCandidateCV.cvUrl} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors" download={`${selectedCandidateCV.name}_CV.pdf`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download
                                    </a>
                                )}
                                <button onClick={() => setCvModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-200 flex items-center justify-center p-2">
                            {selectedCandidateCV.cvUrl ? (
                                <CVPreview url={selectedCandidateCV.cvUrl} name={selectedCandidateCV.name} />
                            ) : (
                                <div className="text-center text-slate-500">
                                    <File size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-black uppercase tracking-widest mb-1">No CV Available</p>
                                    <p className="text-xs font-bold">This candidate's CV has not been uploaded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 flex flex-col items-center justify-center shrink-0">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} className="text-white" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-center">CV Parsed Successfully!</h2>
                            <p className="text-sm text-white/80 mt-2">Data for <span className="font-bold">{parsedCandidateName}</span> is ready to save.</p>
                        </div>
                        
                        {editableData && (
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portal Date</p><input type="date" value={editableData.portalDate} onChange={(e) => handleEditableChange('portalDate', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portal</p><select value={editableData.portal} onChange={(e) => handleEditableChange('portal', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none"><option value="Naukri">Naukri</option><option value="Indeed">Indeed</option><option value="Maven">Maven</option><option value="Other">Other</option></select></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</p><input type="text" value={editableData.name} onChange={(e) => handleEditableChange('name', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p><input type="email" value={editableData.email} onChange={(e) => handleEditableChange('email', e.target.value)} className="w-full text-sm font-bold text-blue-600 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none lowercase" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p><input type="text" value={editableData.mobile} onChange={(e) => handleEditableChange('mobile', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p><input type="text" value={editableData.location} onChange={(e) => handleEditableChange('location', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</p><select value={editableData.gender} onChange={(e) => handleEditableChange('gender', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option><option value="NA">NA</option></select></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qualification</p><input type="text" value={editableData.qualification} onChange={(e) => handleEditableChange('qualification', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p><input type="text" value={editableData.experience} onChange={(e) => handleEditableChange('experience', e.target.value)} className="w-full text-sm font-bold text-orange-600 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recent Company</p><input type="text" value={editableData.recentCompany} onChange={(e) => handleEditableChange('recentCompany', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">College</p><input type="text" value={editableData.collegeName} onChange={(e) => handleEditableChange('collegeName', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Top Skills</p><input type="text" value={editableData.topSkills} onChange={(e) => handleEditableChange('topSkills', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p><input type="text" value={editableData.designation} onChange={(e) => handleEditableChange('designation', e.target.value)} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3 col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All Skills</p><textarea value={editableData.allSkills} onChange={(e) => handleEditableChange('allSkills', e.target.value)} rows={2} className="w-full text-sm font-bold text-slate-800 bg-transparent border border-slate-300 rounded p-2 focus:border-blue-500 outline-none resize-none" /></div>
                                    <div className="bg-slate-50 rounded-lg p-3 col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All Companies</p><textarea value={editableData.allCompanies} onChange={(e) => handleEditableChange('allCompanies', e.target.value)} rows={2} className="w-full text-sm font-bold text-slate-800 bg-transparent border border-slate-300 rounded p-2 focus:border-blue-500 outline-none resize-none" /></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="p-6 border-t border-slate-100 shrink-0">
                            <div className="flex gap-3">
                                <button onClick={() => { setSuccessModalOpen(false); setEditableData(null); setSelectedFile(null); }} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-colors cursor-pointer">Cancel</button>
                                <button onClick={handleSaveToDatabase} disabled={isSaving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSaving ? <><Loader2 size={16} className="animate-spin" /> Please wait...!</> : "Yes, Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Candidate Modal (Kept for UI completeness, mocked logic path bypasses it) */}
            {duplicateModalOpen && duplicateData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-amber-500 text-white p-5 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2"><AlertCircle size={18}/> Candidate Already Exists</h2>
                                <p className="text-xs font-bold text-white/80 mt-1">Added by: {duplicateData.existing_user_name}</p>
                            </div>
                            <button onClick={() => setDuplicateModalOpen(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Interaction History</h3>
                            {duplicateData.conversations && duplicateData.conversations.length > 0 ? (
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    {duplicateData.conversations.map((conv, idx) => (
                                        <div key={conv.conversation_id || idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2"><User size={12} className="text-slate-400" /><span className="text-xs font-black text-slate-700 uppercase">{conv.users?.name || conv.user_id || 'Unknown'}</span></div>
                                            <div className="flex flex-wrap gap-3 text-[10px] mb-2">
                                                <div><span className="text-slate-400 font-bold">Status: </span><span className={`px-1.5 py-0.5 rounded font-black ${conv.candidate_status === 'Shortlisted' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{conv.candidate_status || '-'}</span></div>
                                                <div><span className="text-slate-400 font-bold">Rel. Exp: </span><span className="font-bold text-slate-700">{conv.relevant_exp || '-'}</span></div>
                                                <div><span className="text-slate-400 font-bold">Curr CTC: </span><span className="font-bold text-slate-700">{conv.curr_ctc || '-'}</span></div>
                                                <div><span className="text-slate-400 font-bold">Exp CTC: </span><span className="font-bold text-emerald-600">{conv.exp_ctc || '-'}</span></div>
                                            </div>
                                            {conv.remarks && <p className="text-[10px] font-medium text-slate-600 italic border-l-2 border-slate-300 pl-2">"{conv.remarks}"</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400"><MessageSquare size={24} className="mx-auto mb-2 opacity-50" /><p className="text-xs font-bold">No interactions yet</p></div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-center gap-3 shrink-0">
                            <button onClick={() => { setDuplicateModalOpen(false); setDuplicateData(null); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors cursor-pointer">Close</button>
                            <button onClick={() => alert("Added! (Mock)")} disabled={isAddingToParsing} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                                {isAddingToParsing ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : <><CheckCircle2 size={14}/> Add in my Parsing Data</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}