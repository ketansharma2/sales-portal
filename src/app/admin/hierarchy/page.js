"use client";
import { useState } from "react";
import { 
    Users, UploadCloud, Building2, Rocket, FileImage, 
    MonitorSmartphone, ShieldCheck, Briefcase, Maximize2
} from "lucide-react";

export default function HierarchyPage() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState("admin"); // 'admin', 'operations', 'sales', 'delivery', 'tech'
    
    // Simulated state to hold uploaded document URLs (or files) per department
    const [documents, setDocuments] = useState({
        admin: null, // e.g., "https://example.com/entire-org-chart.png"
        operations: null,
        sales: null,
        delivery: null,
        tech: null
    });

    // --- TABS CONFIGURATION ---
    const tabs = [
        { id: "admin", label: "Entire Organization", icon: <ShieldCheck size={16} /> },
        { id: "operations", label: "Operations", icon: <Briefcase size={16} /> },
        { id: "sales", label: "Sales", icon: <Building2 size={16} /> },
        { id: "delivery", label: "Delivery", icon: <Rocket size={16} /> },
        { id: "tech", label: "Tech", icon: <MonitorSmartphone size={16} /> },
    ];

    // --- HANDLERS ---
    const handleFileUpload = (e, deptId) => {
        const file = e.target.files[0];
        if (file) {
            // For demonstration, creating a local object URL to view the image
            const fileUrl = URL.createObjectURL(file);
            setDocuments(prev => ({
                ...prev,
                [deptId]: fileUrl
            }));
            // Note: In real app, you would upload this file to S3/Server here
        }
    };

    // --- RENDER DOCUMENT VIEWER ---
    const renderViewer = (deptId) => {
        const currentDoc = documents[deptId];
        const tabInfo = tabs.find(t => t.id === deptId);

        return (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[70vh] animate-in fade-in duration-500">
                
                {/* Viewer Header & Upload Controls */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            {tabInfo.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{tabInfo.label} Chart</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {currentDoc ? "Document Uploaded" : "No Document Found"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            id={`upload-${deptId}`} 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, deptId)}
                        />
                        
                        {/* Upload Button */}
                        <label 
                            htmlFor={`upload-${deptId}`}
                            className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <UploadCloud size={16} /> 
                            {currentDoc ? "Update Chart" : "Upload Chart"}
                        </label>
                        
                        {/* Fullscreen Button (Simulated) */}
                        {currentDoc && (
                            <button className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-lg transition-colors shadow-sm" title="View Fullscreen">
                                <Maximize2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Document Display Area */}
                <div className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center p-6 relative overflow-auto">
                    {currentDoc ? (
                        // Shows Uploaded Image
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img 
                                src={currentDoc} 
                                alt={`${tabInfo.label} Hierarchy`} 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
                            />
                        </div>
                    ) : (
                        // Blank State
                        <div className="text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <FileImage size={32} className="text-slate-300" />
                            </div>
                            <h4 className="text-lg font-black text-slate-600 uppercase tracking-widest mb-1">No Chart Uploaded</h4>
                            <p className="text-xs font-bold text-slate-400 max-w-sm">
                                Please upload an image or PDF document to display the hierarchy chart for the {tabInfo.label} department.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
            
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <Users size={24} className="text-blue-600"/> Organization Hierarchy
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        View and manage department structural charts
                    </p>
                </div>
            </div>

            {/* --- CUSTOM TABS --- */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-t-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                            activeTab === tab.id
                            ? 'bg-[#103c7f] text-white shadow-md'
                            : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* --- TAB CONTENT (DOCUMENT VIEWER) --- */}
            <div className="w-full">
                {renderViewer(activeTab)}
            </div>

        </div>
    );
}