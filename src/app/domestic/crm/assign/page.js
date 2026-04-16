"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
    ClipboardList, Calendar, Users, Briefcase, IndianRupee,
    Target, Plus, Trash2, Search, Edit, Activity, X,
    BarChart2, FileText, Send, UserCheck, TrendingUp, Database,
    MessageSquarePlus, Building2, Clock, Eye , Download, AlertTriangle
} from "lucide-react";

export default function AssignWorkPage() {
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // View Work Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState(null);

    // JD View Modal State
    const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
    const [currentJdView, setCurrentJdView] = useState(null);

    // Dynamic Clients List
    const [clientsList, setClientsList] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);

    // Dynamic Branches List (for selected client)
    const [branchesList, setBranchesList] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Dynamic Requirements/Profiles List (for selected branches)
    const [requirementsList, setRequirementsList] = useState([]);
    const [loadingRequirements, setLoadingRequirements] = useState(false);

    // Dynamic TL Users List (from database)
    const [tlUsersList, setTlUsersList] = useState([]);
    const [loadingTlUsers, setLoadingTlUsers] = useState(true);
    
    // Initial Form State
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const initialForm = {
        date: getTodayDate(),
        client: "",
        profile: "",
        package_salary: "",
        requirement: "",
        tl_assigned: "",
        jd: null // Added JD object
    };
    const [formData, setFormData] = useState(initialForm);

    // Fetch clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/domestic/crm/clients', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setClientsList(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Fetch TL users on component mount
    useEffect(() => {
        const fetchTlUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/domestic/crm/tl-users', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setTlUsersList(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch TL users:', error);
            } finally {
                setLoadingTlUsers(false);
            }
        };
        fetchTlUsers();
    }, []);

    // Fetch workbench assignments on component mount
    useEffect(() => {
        const fetchWorkbenchAssignments = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/domestic/crm/workbench', {
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
                        client: item.client_id,
                        client_name: item.client_name,
                        profile: item.job_title,
                        package_salary: item.package || '',
                        requirement: item.requirement?.toString() || '',
                        tl_assigned: item.sent_to_tl,
                        tl_name: item.tl_name,
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
                        recruiter: '', slot: '', progress: null, tlRemarks: [], rc_remarks: item.rc_remarks || '', tl_remarks: item.tl_remarks || '', cv_remarks: item.cv_remarks || '', rc_name: item.rc_name || '', advance_sti: item.advance_sti || '', tracker_sent: item.tracker_sent || 0, today_asset: item.today_asset || 0, today_conversion: item.today_conversion || 0, cv_naukri: item.cv_naukri || 0, cv_indeed: item.cv_indeed || 0, cv_other: item.cv_other || 0, totalCv: item.totalCv || 0
                    }));
                    setAssignments(transformedAssignments);
                }
            } catch (error) {
                console.error('Failed to fetch workbench assignments:', error);
            }
        };
        fetchWorkbenchAssignments();
    }, []);

    // Fetch branches when client is selected
    useEffect(() => {
        if (!formData.client) {
            setBranchesList([]);
            setRequirementsList([]);
            return;
        }

        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch(`/api/domestic/crm/branches?client_id=${formData.client}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setBranchesList(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, [formData.client]);

    // Fetch requirements when branches are loaded
    useEffect(() => {
        if (branchesList.length === 0) {
            setRequirementsList([]);
            return;
        }

        const fetchRequirements = async () => {
            setLoadingRequirements(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const branchIds = branchesList.map(b => b.branch_id).join(',');
                const response = await fetch(`/api/domestic/crm/requirements?branch_ids=${branchIds}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setRequirementsList(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch requirements:', error);
            } finally {
                setLoadingRequirements(false);
            }
        };
        fetchRequirements();
    }, [branchesList]);

    // --- MOCK TABLE DATA ---
    
    // --- HANDLERS ---

    // Handle Profile Change with Auto-fill Logic
    const handleProfileChange = (e) => {
        const val = e.target.value;
        
        // Find in requirementsList (from database)
        const selectedRequirement = requirementsList.find(r => r.job_title === val);
        
        if (selectedRequirement) {
            // Auto-fill from database requirement
            setFormData({
                ...formData,
                profile: val,
                package_salary: selectedRequirement.package || "",
                requirement: selectedRequirement.openings?.toString() || "",
                jd: {
                    title: selectedRequirement.job_title,
                    summary: selectedRequirement.job_summary || "",
                    skills: selectedRequirement.req_skills || "",
                    location: selectedRequirement.location || "",
                    experience: selectedRequirement.experience || "",
                    employment_type: selectedRequirement.employment_type || "",
                    working_days: selectedRequirement.working_days || "",
                    timings: selectedRequirement.timings || "",
                    package_salary: selectedRequirement.package || "",
                    tool_requirement: selectedRequirement.tool_req || "",
                    rnr: selectedRequirement.rnr || "",
                    preferred_qual: selectedRequirement.preferred_qual || "",
                    company_offers: selectedRequirement.company_offers || "",
                    contact_details: selectedRequirement.contact_details || ""
                }
            });
        } else {
            setFormData({ ...formData, profile: val, jd: null });
        }
    };

    const handleAddOrUpdate = async () => {
        if (!formData.client || !formData.profile || !formData.tl_assigned || !formData.requirement) {
            alert("Please fill all mandatory fields (Client, Profile, Requirement, TL)!");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode) {
                // Find the selected requirement to get req_id
                const selectedRequirement = requirementsList.find(r => r.job_title === formData.profile);
                
                if (!selectedRequirement) {
                    alert("Please select a valid profile from the dropdown!");
                    return;
                }

                try {
                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                    const response = await fetch('/api/domestic/crm/workbench', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            workbench_id: editId,
                            date: formData.date,
                            client_id: formData.client,
                            req_id: selectedRequirement.req_id,
                            package_salary: formData.package_salary,
                            req: formData.requirement,
                            sent_to_tl: formData.tl_assigned,
                            sent_to_rc: null
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Refresh assignments from API to get complete data with joins
                        const refreshResponse = await fetch('/api/domestic/crm/workbench', {
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        });
                        const refreshData = await refreshResponse.json();
                        if (refreshData.success) {
                            const transformedAssignments = refreshData.data.map(item => ({
                                id: item.id,
                                date: item.date,
                                client: item.client_id,
                                client_name: item.client_name,
                                profile: item.job_title,
                                package_salary: item.package || '',
                                requirement: item.requirement?.toString() || '',
                                tl_assigned: item.sent_to_tl,
                                tl_name: item.tl_name,
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
                                recruiter: '', slot: '', progress: null, tlRemarks: [], rc_remarks: item.rc_remarks || '', tl_remarks: item.tl_remarks || '', cv_remarks: item.cv_remarks || '', rc_name: item.rc_name || ''
                            }));
                            setAssignments(transformedAssignments);
                        }
                        alert("Assignment updated successfully!");
                    } else {
                        alert(`Failed to update assignment: ${data.error}`);
                    }
                } catch (error) {
                    console.error('Error updating assignment:', error);
                    alert("Failed to update assignment. Please try again.");
                }
            } else {
                // Find the selected requirement to get req_id
                const selectedRequirement = requirementsList.find(r => r.job_title === formData.profile);
                
                if (!selectedRequirement) {
                    alert("Please select a valid profile from the dropdown!");
                    return;
                }

                // Check for duplicate assignment (same date, client_id, req_id, and sent_to_tl)
                const duplicateExists = assignments.some(item =>
                    item.date === formData.date &&
                    item.client === formData.client &&
                    item.profile === formData.profile &&
                    item.tl_assigned === formData.tl_assigned
                );

                if (duplicateExists) {
                    alert("An assignment with the same Date, Client, Profile, and TL already exists!");
                    return;
                }

                try {
                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                    const response = await fetch('/api/domestic/crm/workbench', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            date: formData.date,
                            client_id: formData.client,
                            req_id: selectedRequirement.req_id,
                            package_salary: formData.package_salary,
                            req: formData.requirement,
                            sent_to_tl: formData.tl_assigned,
                            sent_to_rc: null
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Refresh assignments from API to get complete data with joins
                        const refreshResponse = await fetch('/api/domestic/crm/workbench', {
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        });
                        const refreshData = await refreshResponse.json();
                        if (refreshData.success) {
                            const transformedAssignments = refreshData.data.map(item => ({
                                id: item.id,
                                date: item.date,
                                client: item.client_id,
                                client_name: item.client_name,
                                profile: item.job_title,
                                package_salary: item.package || '',
                                requirement: item.requirement?.toString() || '',
                                tl_assigned: item.sent_to_tl,
                                tl_name: item.tl_name,
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
                                recruiter: '', slot: '', progress: null, tlRemarks: [], rc_remarks: item.rc_remarks || '', tl_remarks: item.tl_remarks || '', cv_remarks: item.cv_remarks || '', rc_name: item.rc_name || ''
                            }));
                            setAssignments(transformedAssignments);
                        }
                        alert("Assignment created successfully!");
                    } else {
                        alert(`Failed to create assignment: ${data.error}`);
                    }
                } catch (error) {
                    console.error('Error creating assignment:', error);
                    alert("Failed to create assignment. Please try again.");
                }
            }
            
            setFormData({ ...initialForm, date: formData.date });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            date: item.date,
            client: item.client,
            profile: item.profile,
            package_salary: item.package_salary,
            requirement: item.requirement,
            tl_assigned: item.tl_assigned,
            jd: item.jd,
            client_name: item.client_name,
            tl_name: item.tl_name
        });
        setIsEditMode(true);
        setEditId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top form
    };

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure you want to delete this assignment?")) {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch(`/api/domestic/crm/workbench?workbench_id=${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // Refresh assignments from API
                    const refreshResponse = await fetch('/api/domestic/crm/workbench', {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });
                    const refreshData = await refreshResponse.json();
                    if (refreshData.success) {
                        const transformedAssignments = refreshData.data.map(item => ({
                            id: item.id,
                            date: item.date,
                            client: item.client_id,
                            client_name: item.client_name,
                            profile: item.job_title,
                            package_salary: item.package || '',
                            requirement: item.requirement?.toString() || '',
                            tl_assigned: item.sent_to_tl,
                            tl_name: item.tl_name,
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
                            recruiter: '', slot: '', progress: null, tlRemarks: [], rc_remarks: item.rc_remarks || '', tl_remarks: item.tl_remarks || '', cv_remarks: item.cv_remarks || '', rc_name: item.rc_name || ''
                        }));
                        setAssignments(transformedAssignments);
                    }
                    alert("Assignment deleted successfully!");
                } else {
                    alert(`Failed to delete assignment: ${data.error}`);
                }
            } catch (error) {
                console.error('Error deleting assignment:', error);
                alert("Failed to delete assignment. Please try again.");
            }
        }
    };

    const handleViewWork = (item) => {
        setSelectedWork(item);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredData = assignments.filter(item => {
        const clientName = item.client_name || clientsList.find(c => c.client_id === item.client)?.company_name || item.client;
        const tlName = item.tl_name || tlUsersList.find(tl => tl.user_id === item.tl_assigned)?.name || item.tl_assigned;
        return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tlName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6 relative">
            
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
                    <div className="flex-[0.8] min-w-[110px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    {/* Client Dropdown */}
                    <div className="flex-[2] min-w-[150px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Client Name</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm bg-white"
                            value={formData.client}
                            onChange={(e) => setFormData({...formData, client: e.target.value})}
                            disabled={loadingClients}
                        >
                            <option value="">{loadingClients ? "Loading..." : "Select Client..."}</option>
                            {clientsList.map(c => <option key={c.client_id} value={c.client_id}>{c.company_name}</option>)}
                        </select>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="flex-[2] min-w-[150px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Profile</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm bg-white"
                            value={formData.profile}
                            onChange={handleProfileChange}
                            disabled={loadingRequirements || !formData.client}
                        >
                            <option value="">{loadingRequirements ? "Loading..." : (formData.client ? "Select Profile..." : "Select client first")}</option>
                            {requirementsList.map(r => <option key={r.req_id} value={r.job_title}>{r.job_title}</option>)}
                        </select>
                    </div>

                    {/* Package */}
                    <div className="flex-1 min-w-[90px]">
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
                    <div className="flex-[0.8] min-w-[90px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Requirement</label>
                        <input 
                            type="number" 
                            placeholder="Count"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-[#103c7f] outline-none shadow-sm"
                            value={formData.requirement}
                            onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                        />
                    </div>

                    {/* View JD Button (NEW) */}
                    <div className="flex-[0.8] min-w-[90px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">View JD</label>
                        <button
                            disabled={!formData.jd}
                            onClick={() => { setCurrentJdView(formData.jd); setIsJdViewModalOpen(true); }}
                            className={`w-full py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 border ${formData.jd ? 'bg-blue-50 text-[#103c7f] border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                        >
                            <Eye size={14}/> JD
                        </button>
                    </div>

                    {/* TL Dropdown */}
                    <div className="flex-[1.5] min-w-[130px]">
                        <label className="text-[10px] font-bold text-[#103c7f] uppercase block mb-1">Assign To TL</label>
                        <select
                            className="w-full border border-[#103c7f] rounded-lg p-2 text-sm font-black text-[#103c7f] bg-blue-50 focus:border-blue-800 outline-none shadow-sm"
                            value={formData.tl_assigned}
                            onChange={(e) => setFormData({...formData, tl_assigned: e.target.value})}
                            disabled={loadingTlUsers}
                        >
                            <option value="">{loadingTlUsers ? "Loading..." : "Select TL..."}</option>
                            {tlUsersList.map(tl => <option key={tl.user_id} value={tl.user_id}>{tl.name}</option>)}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            onClick={handleAddOrUpdate}
                            disabled={isSubmitting}
                            className={`text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition flex items-center gap-2 h-[38px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''} ${isEditMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#103c7f] hover:bg-blue-900'}`}
                        >
                            {isSubmitting ? (
                                <>Please wait...</>
                            ) : isEditMode ? (
                                <><Edit size={16}/> Update</>
                            ) : (
                                <><Plus size={16}/> Assign</>
                            )}
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
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> JD</div></th>
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
                                        {item.client_name || clientsList.find(c => c.client_id === item.client)?.company_name || item.client}
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

                                    <td className="p-3 border-r border-gray-100 text-center align-middle">
                                        <button
                                            onClick={() => { setCurrentJdView(item.jd); setIsJdViewModalOpen(true); }}
                                            disabled={!item.jd}
                                            className={`p-1.5 mx-auto flex items-center justify-center rounded transition ${item.jd ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200' : 'text-gray-400 bg-gray-50 cursor-not-allowed'}`}
                                            title={item.jd ? "View Attached JD" : "No JD Attached"}
                                        >
                                            <FileText size={14} />
                                        </button>
                                    </td>
                                    
                                    <td className="p-3 border-r border-gray-100">
                                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                            {item.tl_name || tlUsersList.find(tl => tl.user_id === item.tl_assigned)?.name || item.tl_assigned}
                                        </span>
                                    </td>
                                    
                                    <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-center items-center gap-1.5">
                                            {/* Edit Button */}
                                            {(() => {
                                                const isPast = new Date(item.date) < new Date(new Date().toISOString().split('T')[0]);
                                                return (
                                                    <>
                                                        <button
                                                            onClick={() => !isPast && handleEdit(item)}
                                                            disabled={isPast}
                                                            className={`p-1.5 border rounded transition ${isPast ? 'text-gray-300 bg-gray-50 border-gray-200 cursor-not-allowed' : 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'}`}
                                                            title={isPast ? "Cannot edit past date assignments" : "Edit Assignment"}
                                                        >
                                                            <Edit size={14} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleViewWork(item)}
                                                            className="p-1.5 text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
                                                            title="View Downstream Progress"
                                                        >
                                                            <Activity size={14} />
                                                        </button>

                                                        <button
                                                            onClick={() => !isPast && handleDelete(item.id)}
                                                            disabled={isPast}
                                                            className={`p-1.5 border rounded transition ${isPast ? 'text-gray-300 bg-gray-50 border-gray-200 cursor-not-allowed' : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'}`}
                                                            title={isPast ? "Cannot delete past date assignments" : "Delete Assignment"}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>

                                </tr>
                            ))) : (
                                <tr>
                                    <td colSpan="9" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest">
                                        No assignments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                    {/* Agar logo display na ho, toh next.js Image ki jagah standard <img/> use kar sakte hain */}
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

            {/* --- VIEW WORK MODAL (CRM SIDE) --- */}
            {isViewModalOpen && selectedWork && (
<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-md uppercase tracking-wide flex items-center gap-2"><BarChart2 size={18}/> Work Progress Summary</h3>
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
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-[10px] font-black border border-purple-200 block mb-1">TL: {selectedWork.tl_name}</span>
                                    {selectedWork?.rc_name && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-200 block mb-1">RC: {selectedWork.rc_name}</span>}
                                    <span className="text-[10px] text-gray-400 font-bold block">{selectedWork.slot}</span>
                                </div>
                            </div>

                            {selectedWork && (selectedWork.tracker_sent > 0 || selectedWork.totalCv > 0 || selectedWork.advance_sti) ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 col-span-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1.5"><FileText size={14}/> Total CVs Parsed</span>
                                                <span className="text-2xl font-black text-blue-700 leading-none">{selectedWork?.totalCv || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-gray-500 bg-white p-2 rounded border border-blue-50">
                                                <span>Naukri: <span className="text-gray-800">{selectedWork?.cv_naukri || 0}</span></span>
                                                <span>Indeed: <span className="text-gray-800">{selectedWork?.cv_indeed || 0}</span></span>
                                                <span>Other: <span className="text-gray-800">{selectedWork?.cv_other || 0}</span></span>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                            <Send size={16} className="text-purple-500 mb-1"/>
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Advance STI</p>
                                            <p className="text-xl font-black text-purple-700">{selectedWork?.advance_sti || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                            <UserCheck size={16} className="text-gray-500 mb-1"/>
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Tracker Sent</p>
                                            <p className="text-xl font-black text-gray-700">{selectedWork?.tracker_sent || 0}</p>
                                        </div>
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                            <div className="text-left"><p className="text-[11px] font-black text-green-700 uppercase flex items-center gap-1.5 mb-0.5"><TrendingUp size={14}/> Today Conversion</p></div>
                                            <p className="text-3xl font-black text-green-700">{selectedWork?.today_conversion || 0}</p>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 col-span-2 flex justify-between items-center">
                                            <div className="text-left"><p className="text-[11px] font-black text-orange-700 uppercase flex items-center gap-1.5 mb-0.5"><Database size={14}/> Today Asset</p></div>
                                            <p className="text-3xl font-black text-orange-600">{selectedWork?.today_asset || 0}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {selectedWork?.progress?.notes && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-1.5"><FileText size={12}/> Your Daily Note</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-yellow-400 pl-3 py-1 bg-yellow-50/30">"{selectedWork?.progress?.notes}"</p>
                                            </div>
                                        )}
                                        {selectedWork?.tl_remarks && selectedWork.tl_remarks.trim() && (
                                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-purple-700 uppercase mb-3 flex items-center gap-1.5 border-b border-purple-100 pb-2"><MessageSquarePlus size={12}/> TL Remarks</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-purple-400 pl-3 py-1 bg-purple-50/30">"{selectedWork?.tl_remarks?.trim() || ''}"</p>
                                            </div>
                                        )}
                                        {selectedWork?.rc_remarks && selectedWork.rc_remarks.trim() && (
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-blue-700 uppercase mb-3 flex items-center gap-1.5 border-b border-blue-100 pb-2"><UserCheck size={12}/> RC Remarks</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-blue-400 pl-3 py-1 bg-blue-50/30">"{selectedWork?.rc_remarks?.trim() || ''}"</p>
                                            </div>
                                        )}
                                        {selectedWork?.cv_remarks && selectedWork.cv_remarks.trim() && (
                                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 shadow-sm">
                                                <h5 className="text-[10px] font-black text-orange-700 uppercase mb-3 flex items-center gap-1.5 border-b border-orange-100 pb-2"><FileText size={12}/> CV Remarks</h5>
                                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-orange-400 pl-3 py-1 bg-orange-50/30">"{selectedWork?.cv_remarks?.trim() || ''}"</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-sm font-bold text-gray-500">No progress logged yet.</p>
                                </div>
                            )}

                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white text-right">
                            <button onClick={() => setIsViewModalOpen(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition shadow-sm">Close View</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}