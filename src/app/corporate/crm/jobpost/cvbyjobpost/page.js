"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  MapPin,
  Phone,
  Mail,
  History,
  X,
  FileText,
  Building2,
  GraduationCap,
  Eye,
  ArrowLeft,
  File,
  Loader2 
} from "lucide-react";
import jsPDF from "jspdf";
import { useRouter, useSearchParams } from "next/navigation";
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
                
                // Detect actual file type from magic bytes if binary/octet-stream
                let detectedType = blob.type;
                if (blob.type === 'binary/octet-stream' || blob.type === 'application/octet-stream') {
                    const arrayBuffer = await blob.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
                    const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    // PDF: starts with 25 50 44 46 (%PDF)
                    if (header.startsWith('25504446')) {
                        detectedType = 'application/pdf';
                    }
                    // PNG: 89 50 4E 47
                    else if (header.startsWith('89504e47')) {
                        detectedType = 'image/png';
                    }
                    // JPG: FF D8 FF
                    else if (header.startsWith('ffd8ff')) {
                        detectedType = 'image/jpeg';
                    }
                    // DOCX (ZIP): 50 4B (PK)
                    else if (header.startsWith('504b')) {
                        detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }
                }
                setFileType(detectedType);
                
                // For images, convert to PDF first
                if (detectedType.startsWith('image/')) {
                    const img = new Image();
                    const imgUrl = URL.createObjectURL(blob);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = imgUrl;
                    });
                    
                    // Convert image to PDF
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
                    // For PDFs with wrong content-type, create blob with correct type
                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                    const fileBlobUrl = URL.createObjectURL(pdfBlob);
                    setBlobUrl(fileBlobUrl);
                } else {
                    // For other files, create blob URL
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

    const isPDF = fileType === 'application/pdf';
    const isImage = fileType && fileType.startsWith('image/');
    const isWord = fileType === 'application/msword' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isImage) {
        // Image converted to PDF - display in iframe (native PDF viewer controls)
        return (
            <iframe
                src={blobUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`CV Image: ${name}`}
            />
        );
    }

    if (isWord) {
        const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
        return (
            <iframe
                src={googleDocsUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`Word Document Preview: ${name}`}
                onError={() => setError('Failed to load preview. The file may not be publicly accessible.')}
            />
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

export default function CVByJobPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const req_id = searchParams.get('req_id');

  const [filters, setFilters] = useState({
    globalSearch: "",
    candidateName: "",
    email: "",
    phone: "",
    profileSearch: "",
    fromDate: "",
    toDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [candidatesData, setCandidatesData] = useState([]);
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    candidate: null,
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
 const [cvModalOpen, setCvModalOpen] = useState(false);
    const [selectedCandidateCV, setSelectedCandidateCV] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!req_id) {
        setLoading(false);
        return;
      }

      try {

                const session = JSON.parse(localStorage.getItem('session') || '{}');

        const response = await fetch(`/api/corporate/crm/conversations/by-req?req_id=${req_id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }
        const result = await response.json();

         const normalizedData = (result.data || []).map(cand => ({
          ...cand,
           skills_all: Array.isArray(cand.skills_all) 
            ? cand.skills_all 
            : (typeof cand.skills_all === 'string' 
                ? cand.skills_all.split(',').map(s => s.trim()).filter(s => s) 
                : []),
          top_skills: Array.isArray(cand.top_skills) 
            ? cand.top_skills 
            : (typeof cand.top_skills === 'string' 
                ? cand.top_skills.split(',').map(s => s.trim()).filter(s => s) 
                : []),
          history: cand.history || [],
          designation: cand.designation || '',
          location: cand.location || '',
          gender: cand.gender || '',
          qualification: cand.qualification || '',
          college: cand.college || '',
          experience: cand.experience || '',
          recent_company: cand.recent_company || '',
          all_skills:  Array.isArray(cand.skills_all) 
    ? cand.skills_all 
    : (typeof cand.skills_all === 'string' 
        ? cand.skills_all.split(',').map(s => s.trim()).filter(s => s) 
        : []),
          companies_worked: Array.isArray(cand.company_names_all)
    ? cand.company_names_all
    : (typeof cand.company_names_all === 'string'
        ? cand.company_names_all.split(',').map(c => c.trim()).filter(c => c)
        : []),
          remarks: cand.remarks || '',
          latest_status: cand.latest_status || '',
          latest_profile: cand.latest_profile || '',
          portal_name: cand.portal || '',
          portal_date: cand.portal_date || '',
          name: cand.name || '',
          email: cand.email || '',
          mobile: cand.mobile || '',
          phone: cand.phone || '',
          cv_url: cand.cv_url || '#'
        }));
        
        setCandidatesData(normalizedData);
        
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [req_id]);

const filteredData = useMemo(() => {
    return candidatesData.filter((cand) => {
      if (filters.globalSearch) {
        const query = filters.globalSearch.toLowerCase();

        const name = cand.name?.toLowerCase() || "";
        const email = cand.email?.toLowerCase() || "";
        const profile = cand.designation?.toLowerCase() || "";
        let skills = [];
        if (cand.top_skills) {
          if (typeof cand.top_skills === 'string') {
            skills = cand.top_skills.split(',').map(s => s.trim());
          } else if (Array.isArray(cand.top_skills)) {
            skills = cand.top_skills;
          }
        }
        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !profile.includes(query) &&
          !skills.some((s) => (s || "").toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      const candidateName = filters.candidateName?.toLowerCase() || "";
      const filterEmail = filters.email?.toLowerCase() || "";
      const filterPhone = filters.phone || "";
      const filterProfile = filters.profileSearch?.toLowerCase() || "";

      const cName = cand.name?.toLowerCase() || "";
      const cEmail = cand.email?.toLowerCase() || "";
      const cPhone = cand.mobile || "";
      const cProfile = cand.designation?.toLowerCase() || "";

      if (candidateName && !cName.includes(candidateName))
        return false;

      if (filterEmail && !cEmail.includes(filterEmail))
        return false;

      if (filterPhone && !cPhone.includes(filterPhone))
        return false;

      if (filterProfile && !cProfile.includes(filterProfile))
        return false;

      if (filters.fromDate || filters.toDate) {
        if (!cand.portal_date) return false;

        const itemDate = new Date(cand.portal_date);
        itemDate.setHours(0, 0, 0, 0);

        if (filters.fromDate && itemDate < new Date(filters.fromDate)) {
          return false;
        }

        if (filters.toDate) {
          const tDate = new Date(filters.toDate);
          tDate.setHours(23, 59, 59, 999);

          if (itemDate > tDate) return false;
        }
      }

      return true;
    });
  }, [filters, candidatesData]);

  const handleClearFilters = () => {
    setFilters({
      globalSearch: "",
      candidateName: "",
      email: "",
      phone: "",
      profileSearch: "",
      fromDate: "",
      toDate: "",
    });
  };

  const openHistoryModal = async (candidate) => {
    setHistoryModal({ isOpen: true, candidate });
    setLoadingHistory(true);
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      // Fetch history for this specific candidate
      const response = await fetch(`/api/corporate/crm/conversations/history?conversation_id=${candidate.parsing_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setHistoryData(result.data || result.history || []);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Close modal function
  const closeHistoryModal = () => {
    setHistoryModal({ isOpen: false, candidate: null });
    setHistoryData([]);
  };

  const getStatusStyle = (status) => {
    if (!status)
      return "bg-blue-50 text-blue-700 border-blue-200";

    if (
      status.includes("Scheduled") ||
      status.includes("Joined") ||
      status.includes("Pending Join")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (
      status.includes("Rejected") ||
      status.includes("Not")
    ) {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2 pb-20">
      {/* --- TOP NAVIGATION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
            <button 
                        onClick={() => router.back()}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                    >
                        <ArrowLeft size={14}/> Back to Job Posts
                    </button>
          <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-blue-500" />
            CV By Job Post
          </h1>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Sourced Candidates & Sourcing History
          </p>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm mb-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Candidate Name
            </label>

            <input
              type="text"
              placeholder="Name..."
              value={filters.candidateName}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  candidateName: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Email ID
            </label>

            <input
              type="text"
              placeholder="Email..."
              value={filters.email}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  email: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Mobile Number
            </label>

            <input
              type="text"
              placeholder="Phone..."
              value={filters.phone}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  phone: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Profile Search
            </label>

            <input
              type="text"
              placeholder="Job Role..."
              value={filters.profileSearch}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  profileSearch: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              From Portal Date
            </label>

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  fromDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              To Portal Date
            </label>

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  toDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
            />
          </div>

          {Object.values(filters).some((val) => val !== "") && (
            <button
              onClick={handleClearFilters}
              className="w-full h-[34px] text-[10px] font-black text-red-500 hover:text-white hover:bg-red-500 uppercase tracking-widest transition-all border border-red-200 rounded-lg"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse max-w-[1000px] table-fixed">
            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-2 border-r border-blue-800 text-center w-12">
                  CV
                </th>

                <th className="p-2 border-r border-blue-800 w-[120px]">
                  Latest Status
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Latest Profile
                </th>

                <th className="p-2 border-r border-blue-800 w-[160px]">
                  Remarks
                </th>

                <th className="p-2 border-r border-blue-800 w-[80px] text-center">
                  Portal Info
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Candidate Details
                </th>

                <th className="p-2 border-r border-blue-800 w-[100px]">
                  Location/Gender
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Qualification/College
                </th>

                <th className="p-2 border-r border-blue-800 w-[100px]">
                  Exp / Recent Co.
                </th>

                <th className="p-2 border-r border-blue-800 w-[120px]">
                  Top Skills
                </th>

                <th className="p-2 border-r border-blue-800 w-[150px]">
                  All Skills & Companies
                </th>

                <th className="p-2 text-center w-[100px]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    Loading Database...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((cand) => (
                  <tr
                    key={cand.conversation_id}
                    className="hover:bg-blue-50/30 transition group"
                  >
                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <button
                        onClick={(e) => {
                                                        e.stopPropagation(); // Prevents row click
                                                        if (cand.cv_url) {
                                                            // Try to open in modal first
                                                            setSelectedCandidateCV(cand);
                                                            setCvModalOpen(true);
                                                        } else {
                                                            // If no CV URL, show alert
                                                            alert("No CV available for this candidate");
                                                        }
                                                    }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition-colors border border-indigo-100 shadow-sm inline-block"
                        title="View CV"
                      >
                        <Eye size={14} />
                      </button>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <span
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center gap-1 w-fit ${getStatusStyle(
                          cand.candidate_status
                        )}`}
                      >
                        {cand.candidate_status}
                      </span>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle font-bold text-gray-800">
                      {cand.designation}
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <p
                        className="text-[10px] text-gray-500 leading-tight line-clamp-2"
                        title={cand.remarks}
                      >
                        {cand.remarks}
                      </p>
                    </td>

                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] font-black text-[#103c7f] bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                          {cand.portal}
                        </span>

                        <span className="font-mono text-[10px] text-gray-500">
                          {cand.portal_date}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                          <User
                            size={14}
                            className="text-gray-400"
                          />
                          {cand.name}
                        </span>

                        <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                          <Mail
                            size={10}
                            className="text-blue-400"
                          />
                          {cand.email}
                        </span>

                        <span className="text-[10px] font-mono font-bold text-gray-600 flex items-center gap-1.5">
                          <Phone
                            size={10}
                            className="text-green-500"
                          />
                          {cand.phone}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-gray-700 flex items-center gap-1">
                          <MapPin
                            size={12}
                            className="text-red-400"
                          />
                          {cand.location}
                        </span>

                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {cand.gender}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-700 flex items-center gap-1">
                          <GraduationCap
                            size={12}
                            className="text-indigo-400 shrink-0"
                          />
                          {cand.qualification}
                        </span>

                        <span
                          className="text-[9px] text-gray-500 font-medium truncate"
                          title={cand.college}
                        >
                          {cand.college}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-emerald-600 text-sm">
                          {cand.experience}
                        </span>

                        <span
                          className="text-[10px] text-gray-500 flex items-center gap-1 line-clamp-1"
                          title={cand.recent_company}
                        >
                          <Building2 size={10} />
                          {cand.recent_company}
                        </span>
                      </div>
                    </td>

<td className="p-2 border-r border-gray-100 align-middle">
  <div className="flex flex-wrap gap-1">
    {(cand.top_skills || []).slice(0, 3).map((skill, i) => (
      <span
        key={i}
        className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
      >
        {skill}
      </span>
    ))}

    {(cand.top_skills || []).length > 3 && (
      <div className="relative inline-block group">
        <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer group-hover:bg-blue-200 transition-colors">
          +{cand.top_skills.length - 3}
        </span>

        {/* Tooltip - Fixed with group-hover */}
        <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-md p-2 min-w-[150px]">
          <div className="flex flex-wrap gap-1">
            {cand.top_skills.slice(3).map((skill, i) => (
              <span
                key={i}
                className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</td>

<td className="p-2 border-r border-gray-100 align-top">
  <div>
  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
    All Skills
  </span>
  <div className="flex flex-wrap gap-1">
    {(() => {
      let allSkillsArray = [];
      if (cand.all_skills) {
        if (Array.isArray(cand.all_skills)) {
          allSkillsArray = cand.all_skills;
        } else if (typeof cand.all_skills === 'string') {
          allSkillsArray = cand.all_skills.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      
      const displaySkills = allSkillsArray.slice(0, 3);
      const remainingSkills = allSkillsArray.slice(3);
      
      return (
        <>
          {displaySkills.map((skill, i) => (
            <span
              key={i}
              className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
              title={skill}
            >
              {skill.length > 15 ? skill.substring(0, 12) + '...' : skill}
            </span>
          ))}
          
          {remainingSkills.length > 0 && (
            <div className="relative inline-block group">
              <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer group-hover:bg-blue-200 transition-colors">
                +{remainingSkills.length}
              </span>
              
              {/* Tooltip - Fixed with group-hover */}
              <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-md p-2 min-w-[200px] max-w-xs">
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                  {remainingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {allSkillsArray.length === 0 && (
            <span className="text-[9px] text-gray-400 italic">No skills listed</span>
          )}
        </>
      );
    })()}
  </div>
</div>
</td>
                    <td className="p-2 text-center bg-white align-middle group-hover:bg-blue-50 transition-colors sticky right-0 z-10 border-l shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                      <button
                        onClick={() => openHistoryModal(cand)}
                        className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-[#103c7f] hover:text-white px-1 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex flex-col items-center justify-center gap-1"
                      >
                        <History size={16} />
                        View Log
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    No candidates found in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= HISTORY MODAL ================= */}
      {historyModal.isOpen && historyModal.candidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#103c7f] text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <History
                    size={20}
                    className="text-blue-300"
                  />
                  Calling & Processing History
                </h2>

                <p className="text-xs font-bold text-blue-200 mt-1 flex items-center gap-2">
                  <User size={12} />
                  {historyModal.candidate.name}
                  <Phone size={12} />
                  {historyModal.candidate.phone}
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoryModal({
                    isOpen: false,
                    candidate: null,
                  })
                }
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-gray-50 flex-1 overflow-hidden flex flex-col">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase font-black sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-3 border-b border-r">
                          RC Name
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Calling Date
                        </th>

                        <th className="p-3 border-b border-r">
                          Client & Profile
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Apply Date
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Curr / Exp CTC
                        </th>

                        <th className="p-3 border-b border-r w-[250px]">
                          Feedback / Remarks
                        </th>

                        <th className="p-3 border-b text-center">
                          Candidate Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-xs divide-y divide-gray-100">
                      {historyData.length >
                      0 ? (
                      historyData.map(
                          (log) => (
                            <tr
                              key={log.conversation_id}
                              className="hover:bg-blue-50/30"
                            >
                              <td className="p-3 border-r font-bold text-[#103c7f]">
                                {log.rc_name}
                              </td>

                              <td className="p-3 border-r text-center font-mono text-gray-600">
                                {log.calling_date}
                              </td>

                              <td className="p-3 border-r font-bold text-gray-800">
                                {log.client_name} - {log.job_title}
                              </td>

                              <td className="p-3 border-r text-center font-mono text-gray-600">
                                {log.apply_date}
                              </td>

                              <td className="p-3 border-r text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="text-[10px] font-bold text-gray-500">
                                    Curr:
                                    <span className="text-gray-800">
                                      {" "}
                                      {log.curr_ctc}
                                    </span>
                                  </span>

                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                                    Exp: {log.exp_ctc}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 border-r">
                                <p className="text-[11px] text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                                  {log.remarks}
                                </p>
                              </td>

                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center justify-center w-full ${getStatusStyle(
                                    log.candidate_status
                                  )}`}
                                >
                                  {log.candidate_status}
                                </span>
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest"
                          >
                            No history logs found for this
                            candidate.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}
       {cvModalOpen && selectedCandidateCV && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                              <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
                                  <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                                      <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                          <FileText size={18}/> Original Resume: {selectedCandidateCV.name}
                                      </h2>
                                      <div className="flex items-center gap-3">
                                          {selectedCandidateCV.cv_url && (
                                              <a
                                                  href={selectedCandidateCV.cv_url}
                                                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                                  download={`${selectedCandidateCV.name}_CV.pdf`}
                                              >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                  </svg>
                                                  Download
                                              </a>
                                          )}
                                          <button onClick={() => setCvModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                              <X size={20} />
                                          </button>
                                      </div>
                                  </div>
                                  <div className="flex-1 bg-slate-200 flex items-center justify-center p-2">
                                      {selectedCandidateCV.cv_url ? (
                                          <CVPreview url={selectedCandidateCV.cv_url} name={selectedCandidateCV.name} />
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
    </div>
  );
}