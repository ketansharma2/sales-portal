"use client";
import React, { useState, useEffect } from "react";
import { 
  Filter, Calendar, Briefcase, Plus, X, Save, 
  Target, Layers, BarChart2, Calculator, Percent, Trash2,
  Edit, Eye, Building, TrendingUp, Headset, User
} from "lucide-react";

export default function HodTargetPage() {
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeDeptTab, setActiveDeptTab] = useState("Sales"); 

  // Filter States
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterSector, setFilterSector] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [filterName, setFilterName] = useState("All");
const [sectors, setSectors] = useState([]);
const [roles, setRoles] = useState([]);


const fetchTargets = async () => {
  try {
    setLoading(true);

    const session = JSON.parse(localStorage.getItem("session") || "{}");

   const apiUrl =
      activeDeptTab === "Sales"
        ? "/api/hod/targets/list/salelist"
        : "/api/hod/targets/list/deliverylist";

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    console.log('data:',data);
    if (data.success) {
const normalizedTargets = data.data.map((t) => ({
  id: t.id || t.target_id,

  year: t.year,
  month: t.month,
  workingDays: t.working_days,

  department: t.dept,
  sector: t.sector,
  role: t.role,

  // ✅ from backend
  assignedTo: t.assigned_name,

  guideline: t.guideline,
  kpi_metric: t.kpi,
  frequency: t.frequency,

  target: t.total_target,
  achieved: t.achieved || 0,

  user_id: t.assigned_to,
  created_at: t.created_at,
}));
     setTargets(normalizedTargets);
    }
  } catch (err) {
    console.error("Fetch targets error:", err);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
    fetchTargets();
  fetchUsers();
}, [activeDeptTab]);
const fetchUsers = async () => {
  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");

    // ✅ Dynamic API based on tab
    const apiUrl =
      activeDeptTab === "Sales"
        ? "/api/hod/targets/get-sales-users"
        : "/api/hod/targets/get-delivery-users";

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch users");

    const data = await res.json();

    if (data.success) {
     const usersData = data.data.map((u) => {
  let role = "";

  if (Array.isArray(u.role)) {
    // ✅ Department-based role selection
    if (activeDeptTab === "Delivery") {
      if (u.role.includes("CRM")) role = "CRM";
      else if (u.role.includes("TL")) role = "Team Lead";
      else role = u.role[0];
    } 
    
    else if (activeDeptTab === "Sales") {
      if (u.role.includes("MANAGER")) role = "Manager";
      else role = u.role[0];
    }
  } else {
    role = u.role || "";
  }

  return {
    ...u,
    role,
    sector: u.sector || "",
  };
});

      setUsers(usersData);


      
      const uniqueSectors = [
        ...new Set(usersData.map((u) => u.sector).filter(Boolean)),
      ];

      const uniqueRoles = [
        ...new Set(usersData.map((u) => u.role).filter(Boolean)),
      ];

      setRoles(uniqueRoles);

     setSectors(uniqueSectors);
    }
  } catch (err) {
    console.error("User fetch error:", err);
  }
};
//   const handleEmployeeChange = (e) => {
//     const selectedUserId = e.target.value;
//     const selectedUser = users.find(u => u.user_id === selectedUserId);
    
//     if (selectedUser) {
//       setForm({
//         ...form,
//         assignedTo: selectedUser.name,
//         sector: selectedUser.sector || form.sector,
//         role: selectedUser.role || form.role
//       });
//     } else {
//       setForm({ ...form, assignedTo: "" });
//     }
//   };

const handleEmployeeChange = (e) => {
  const selectedId = e.target.value;

  const user = users.find((u) => u.user_id === selectedId);
  if (!user) return;

  let autoKPIs = [];

  switch (user.role) {
    case "Head of Department (HOD)":
      autoKPIs = [
        { guideline: "", kpi_metric: "Team Revenue", frequency: "Monthly", target: "" }
      ];
      break;

    case "Sales Manager (SM)":
      autoKPIs = [
        { guideline: "", kpi_metric: "CTC Generation", frequency: "Monthly", target: "" }
      ];
      break;

    case "Account Manager (CRM)":
      autoKPIs = [
        { guideline: "", kpi_metric: "Client Retention", frequency: "Monthly", target: "" },
        { guideline: "", kpi_metric: "Revenue Billed", frequency: "Monthly", target: "" }
      ];
      break;

    default:
      autoKPIs = [
        { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }
      ];
  }

  setForm((prev) => ({
    ...prev,
    assignedTo: user.user_id,   
    assignedName: user.name,// store ID
    role: user.role,
    sector: user.sector,
    targetList: autoKPIs
  }));
};
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); 
  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    month: "",
    workingDays: "",
    department: "Sales",
    sector: "",
    role: "",
    assignedTo: "",
    targetList: [
        { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }
    ]
  });
  
  // --- VIEW MODAL STATES ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // --- DROPDOWN OPTIONS & LOGIC ---
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//   const sectors = ["Domestic", "Corporate", "Both"]; // ✅ Added "Both" for HOD
  
  // ✅ Added HOD to both departments
  const rolesMap = {
      "Sales": ["Manager", "HOD"],
      "Delivery": ["CRM"]
  };

  const kpiMetrics = [
  "CTC Generation",
  "Leads",
  "Contacts",
  "Calls",
  "Onboard",
  "Franchise Accept",
  "Sent To Manager",
  "Acknowledge",
  "Joining",
  "CV Parse",
  "Conversion",
  "Tracker Sent",
  "Interested",
  "Visit",
  "Accuracy"
];
  // --- MOCK DATA ---
  const dummyTargets = [
    {
      id: 1, year: "2026", month: "April", workingDays: "22", department: "Sales", sector: "Corporate", role: "Sales Manager (SM)", assignedTo: "Rahul Sharma",
      guideline: "Focus on maximizing CTC generation across enterprise corporate clients.",
      kpi_metric: "CTC Generation", frequency: "Monthly",
      target: 8000000, achieved: 5200000,
      calculation: "(1 SM × ₹80L/Month)"
    },
    {
      id: 2, year: "2026", month: "April", workingDays: "24", department: "Sales", sector: "Both", role: "Head of Department (HOD)", assignedTo: "Rajesh Kumar (HOD)",
      guideline: "Drive overall Sales Department revenue across both sectors.",
      kpi_metric: "Team Revenue", frequency: "Monthly",
      target: 20000000, achieved: 15000000,
      calculation: "(Total Sales Revenue)"
    },
    {
      id: 3, year: "2026", month: "April", workingDays: "22", department: "Delivery", sector: "Corporate", role: "Account Manager (CRM)", assignedTo: "Aarti Desai",
      guideline: "Ensure near 100% client retention for top corporate accounts and zero escalations.",
      kpi_metric: "Client Retention", frequency: "Monthly",
      target: 100, achieved: 98,
      calculation: "(Overall % for CRM Team)"
    },
    {
      id: 4, year: "2026", month: "April", workingDays: "22", department: "Delivery", sector: "Domestic", role: "Account Manager (CRM)", assignedTo: "Rohan Gupta",
      guideline: "Bill pending domestic invoices before month end.",
      kpi_metric: "Revenue Billed", frequency: "Monthly",
      target: 3000000, achieved: 2400000,
      calculation: "(1 CRM × ₹30L/Month)"
    }
  ];

 

  // --- HANDLERS ---

  const handleOpenModal = (item = null) => {
     fetchUsers();
    if (item && item.id) {
        setEditId(item.id);
        setForm({
            year: item.year, month: item.month, workingDays: item.workingDays || "", 
            department: item.department || activeDeptTab, sector: item.sector, role: item.role, assignedTo: item.user_id || "",
            targetList: [{ 
                guideline: item.guideline, kpi_metric: item.kpi_metric, 
                frequency: item.frequency, target: item.target.toString() 
            }]
        });
    } else {
        setEditId(null);
        setForm({
            year: new Date().getFullYear().toString(), month: "", workingDays: "", 
            department: activeDeptTab, 
            sector: "", role: "", assignedTo: "",
            targetList: [{ guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }]
        });
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (e) => {
      const selectedRole = e.target.value;
      let autoKPIs = [];
      let autoSector = form.sector;

      // ✅ LOGIC: If HOD is selected, force Sector to "Both"
      if (selectedRole === "Head of Department (HOD)") {
          autoSector = "Both";
          autoKPIs = [{ guideline: "", kpi_metric: "Team Revenue", frequency: "Monthly", target: "" }];
      } else if (selectedRole === "Sales Manager (SM)") {
          // If switching away from HOD, reset sector if it was "Both"
          if(autoSector === "Both") autoSector = "";
          autoKPIs = [{ guideline: "", kpi_metric: "CTC Generation", frequency: "Monthly", target: "" }];
      } else if (selectedRole === "Account Manager (CRM)") {
          if(autoSector === "Both") autoSector = "";
          autoKPIs = [
              { guideline: "", kpi_metric: "Client Retention", frequency: "Monthly", target: "" },
              { guideline: "", kpi_metric: "Revenue Billed", frequency: "Monthly", target: "" }
          ];
      } else {
          if(autoSector === "Both") autoSector = "";
          autoKPIs = [{ guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }];
      }

      // Only reset role, sector, and KPIs - keep assignedTo if already selected
      setForm({ ...form, role: selectedRole, sector: autoSector, targetList: autoKPIs });
  };

  const handleViewTarget = (item) => {
      const breakdownData = [
          { id: 1, rc_name: "Subordinate 1", target: Math.floor(item.target / 2), achieved: Math.floor(item.achieved / 2) },
          { id: 2, rc_name: "Subordinate 2", target: Math.ceil(item.target / 2), achieved: Math.ceil(item.achieved / 2) },
      ];
      setViewData({ role: item.role, assignedTo: item.assignedTo, kpi_metric: item.kpi_metric, breakdown: breakdownData });
      setIsViewModalOpen(true);
  };

  const handleTargetChange = (index, field, value) => {
      const newList = [...form.targetList];
      newList[index][field] = value;
      setForm({ ...form, targetList: newList });
  };

  const addTargetRow = () => {
      setForm({ ...form, targetList: [...form.targetList, { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }] });
  };

  const removeTargetRow = (index) => {
      const newList = form.targetList.filter((_, i) => i !== index);
      setForm({ ...form, targetList: newList });
  };

//   const handleSaveTarget = () => {
//     if(!form.month || !form.department || !form.sector || !form.role || !form.workingDays || !form.assignedTo) {
//         alert("Please fill all Target Scope details including Sector and Employee Name.");
//         return;
//     }

//     if (editId) {
//         const t = form.targetList[0];
//         let mockCalc = t.frequency === "Daily" 
//             ? `(1 ${form.role.split(' ')[0]} × Y ${t.kpi_metric}/Day) × ${form.workingDays} Days` 
//             : `(1 ${form.role.split(' ')[0]} × Y ${t.kpi_metric}/Month)`;

//         const updatedTargets = targets.map(item => {
//             if (item.id === editId) {
//                 return {
//                     ...item,
//                     year: form.year, month: form.month, workingDays: form.workingDays, 
//                     department: form.department, sector: form.sector, role: form.role, assignedTo: form.assignedTo,
//                     guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
//                     target: parseInt(t.target) || 0,
//                     calculation: mockCalc
//                 };
//             }
//             return item;
//         });
//         setTargets(updatedTargets);
//     } else {
//         const newEntries = form.targetList.map((t, idx) => {
//             let mockCalc = t.frequency === "Daily" 
//                 ? `(1 ${form.role.split(' ')[0]} × Y ${t.kpi_metric}/Day) × ${form.workingDays} Days` 
//                 : `(1 ${form.role.split(' ')[0]} × Y ${t.kpi_metric}/Month)`;

//             return {
//                 id: Date.now() + idx,
//                 year: form.year, month: form.month, workingDays: form.workingDays, 
//                 department: form.department, sector: form.sector, role: form.role, assignedTo: form.assignedTo,
//                 guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
//                 target: parseInt(t.target) || 0, achieved: 0,
//                 calculation: mockCalc
//             };
//         });
//         setTargets([...newEntries, ...targets]);
//     }
    
//     setIsModalOpen(false);
//     setEditId(null);
//   };


const handleSaveTarget = async () => {
  if (!form.month || !form.department || !form.role || !form.assignedTo) {
    alert("Please fill all required fields");
    return;
  }

  const payload = {
    ...(editId && { id: editId }),
    year: form.year,
    month: form.month,
    working_days: Number(form.workingDays),
    department: form.department,
    sector: form.sector,
    role: form.role,
    user_id: form.assignedTo,
    targets: form.targetList.map(t => ({
      kpi_metric: t.kpi_metric,
      frequency: t.frequency,
      target: Number(t.target),
      guideline: t.guideline
    }))
  };

  // ✅ Debug (optional - remove later)
//   console.log("FINAL PAYLOAD 👉", payload);

  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");

    const res = await fetch("/api/hod/targets/create", {
      method: editId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "API failed");
    }

    // ✅ SUCCESS
    alert(editId ? "Target updated successfully" : "Target created successfully");

    // Close modal
    setIsModalOpen(false);
    setEditId(null);

    // ✅ Reset form (important)
    setForm({
      year: new Date().getFullYear().toString(),
      month: "",
      workingDays: "",
      department: activeDeptTab,
      sector: "",
      role: "",
      assignedTo: "",
      targetList: [
        { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }
      ]
    });

    // ✅ Refresh table (if API exists)
    await fetchTargets();

  } catch (err) {
    console.error("Save error:", err);
    alert(err.message || "Something went wrong");
  }
};
  const handleClearFilters = () => {
    setFilterMonth("All"); setFilterDept("All"); setFilterSector("All"); setFilterRole("All"); setFilterName("All");
  };

  const filteredTargets = targets.filter(item => {
    if (item.department !== activeDeptTab) return false; 
    
    const matchMonth = filterMonth === "All" || item.month === filterMonth;
    const matchDept = filterDept === "All" || item.department === filterDept;
    const matchSector = filterSector === "All" || item.sector === filterSector;
    const matchRole = filterRole === "All" || item.role === filterRole;
    const matchName = filterName === "All" || item.assignedTo === filterName; 
    
    return matchMonth && matchDept && matchSector && matchRole && matchName;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* --- HEADER, TABS & ADD BUTTON ROW --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6 shrink-0">
         
         {/* Left: Title & Subtitle */}
         <div>
            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={24} className="text-blue-500"/> Targets
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Assign and monitor targets</p>
         </div>

         {/* Right: Controls Container (Tabs + Button) */}
         <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
             
             {/* Department Tab Switcher */}
             <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto border border-gray-200 shadow-inner">
                 <button 
                     onClick={() => { setActiveDeptTab("Sales"); handleClearFilters(); }}
                     className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                         activeDeptTab === "Sales" 
                             ? "bg-white text-emerald-700 shadow-sm border border-emerald-100" 
                             : "text-gray-500 hover:text-gray-800"
                     }`}
                 >
                     <TrendingUp size={14} className={activeDeptTab === "Sales" ? "text-emerald-500" : ""} /> Sales Dept
                 </button>
                 <button 
                     onClick={() => { setActiveDeptTab("Delivery"); handleClearFilters(); }}
                     className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                         activeDeptTab === "Delivery" 
                             ? "bg-white text-blue-700 shadow-sm border border-blue-100" 
                             : "text-gray-500 hover:text-gray-800"
                     }`}
                 >
                     <Headset size={14} className={activeDeptTab === "Delivery" ? "text-blue-500" : ""} /> Delivery Dept
                 </button>
             </div>

             {/* Assign Button */}
             <button 
                onClick={() => handleOpenModal()} 
                className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-3 md:py-[11px] rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2 shadow-md w-full md:w-auto shrink-0"
             >
                <Plus size={14}/> Assign New Target
             </button>
             
         </div>
      </div>

      {/* FILTERS SECTION */}
      <div className={`p-4 rounded-xl border shadow-sm mb-6 flex flex-wrap items-end gap-4 bg-white ${activeDeptTab === "Sales" ? "border-emerald-100" : "border-blue-100"}`}>
        <div className="w-36 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Month</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Months</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        <div className="w-36 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Sector</label>
            <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Sectors</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div className="w-48 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Roles</option>
                {rolesMap[activeDeptTab].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
        
        <div className="w-48 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Name</label>
            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Leaders</option>
                {users.map((user) => (
                    <option key={user.user_id} value={user.name}>{user.name}</option>
                ))}
            </select>
        </div>

        {(filterMonth !== "All" || filterSector !== "All" || filterRole !== "All" || filterName !== "All") && (
            <button onClick={handleClearFilters} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent h-[34px]">
              Clear
            </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-270px)] ${activeDeptTab === "Sales" ? "border-emerald-100" : "border-blue-100"}`}>
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
               <thead className={`text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm tracking-widest ${activeDeptTab === "Sales" ? "bg-emerald-700" : "bg-[#103c7f]"}`}>
                  <tr>
                     <th className="p-3 border-r border-white/10 w-24 text-center">Period</th>
                     <th className="p-3 border-r border-white/10 w-24 text-center">Work Days</th>
                     <th className="p-3 border-r border-white/10 w-28 text-center">Sector</th>
                     <th className="p-3 border-r border-white/10 w-56">Assigned To</th>
                     <th className="p-3 border-r border-white/10 min-w-[200px]">Guideline</th>
                     <th className="p-3 border-r border-white/10 w-40">KPI Metric</th>
                     <th className="p-3 border-r border-white/10 text-center w-24">Freq.</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Target</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Achieved</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/20 w-24">%</th>
                     <th className="p-3 text-center bg-black/10 sticky right-0 z-20 w-32 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="11" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading {activeDeptTab} Targets...</td></tr>
                  ) : filteredTargets.length > 0 ? (
                     filteredTargets.map((item) => {
                         const percentage = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
                         let percColor = "text-red-600 bg-red-50 border-red-200";
                         if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                         else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                         return (
                         <tr key={item.id} className="hover:bg-gray-50/80 transition group">
                            
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                               <div className="flex flex-col items-center gap-1">
                                  <span className="font-black text-gray-800">{item.month}</span>
                                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.year}</span>
                               </div>
                            </td>
                            
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className="font-black text-[#103c7f] bg-blue-50 px-2 py-1 rounded border border-blue-100 text-[11px]">
                                    {item.workingDays} <span className="text-[9px] text-blue-500 uppercase">Days</span>
                                </span>
                            </td>

                            <td className="p-3 border-r border-gray-100 align-middle text-center">
                                <span className={`font-bold px-2 py-0.5 rounded border w-fit text-[10px] inline-block ${item.sector === 'Both' ? 'text-purple-700 bg-purple-50 border-purple-200' : activeDeptTab === "Sales" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-[#103c7f] bg-blue-50 border-blue-200"}`}>
                                    {item.sector}
                                </span>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-middle">
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-gray-900 flex items-center gap-1.5"><User size={12} className="text-blue-500"/> {item.assignedTo}</span>
                                    <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider flex items-center gap-1"><Briefcase size={10}/>{item.role}</span>
                                </div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-middle"><p className="text-[11px] text-gray-600 leading-relaxed">{item.guideline}</p></td>
                            <td className="p-3 border-r border-gray-100 align-middle"><span className="font-bold text-indigo-700 flex items-center gap-1.5"><BarChart2 size={12}/>{item.kpi_metric}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.frequency === 'Daily' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{item.frequency}</span>
                            </td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-gray-800">{item.target.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-[#103c7f]">{item.achieved.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>{percentage} <Percent size={10}/></span>
                            </td>
                            
                            {/* ACTION COLUMN */}
                            <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-gray-50 transition-colors">
                               <div className="flex flex-row items-center gap-2 w-full px-1 justify-center">
                                   <button onClick={() => handleOpenModal(item)} className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 min-w-[50px]">
                                       <Edit size={10} /> Edit
                                   </button>
                                   <button onClick={() => handleViewTarget(item)} className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-800 hover:text-white px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 min-w-[50px]">
                                       <Eye size={10} /> View
                                   </button>
                               </div>
                            </td>
                         </tr>
                     )})
                  ) : (
                      <tr><td colSpan="11" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No {activeDeptTab} targets found matching filters</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- ADD/EDIT TARGET MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                <div className={`p-4 flex justify-between items-center text-white ${activeDeptTab === 'Sales' ? 'bg-emerald-700' : 'bg-[#103c7f]'}`}>
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        {editId ? <Edit size={16}/> : <Target size={16}/>} 
                        {editId ? "Edit Target" : `Assign ${activeDeptTab} Target`}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>

                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Scope</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Year</label>
                                <input type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white font-bold"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Month</label>
                                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white">
                                    <option value="">- Select -</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Working Days</label>
                                <input type="number" placeholder="e.g. 22" value={form.workingDays} onChange={e => setForm({...form, workingDays: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Department</label>
                                <select value={form.department} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-gray-100 disabled:opacity-70" disabled>
                                    <option value="Sales">Sales</option>
                                    <option value="Delivery">Delivery</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-blue-600 uppercase">Role</label>
                              <select 
  value={form.role || ""}   // ✅ prevent null error
  onChange={handleRoleChange} 
  className="w-full border border-blue-200 p-2 rounded-lg text-sm outline-none bg-blue-50 focus:border-blue-500"
>
  <option value="">- Select Role -</option>

  {roles.map((r) => (
    <option key={r} value={r}>{r}</option>
  ))}
</select>
                            </div>
                            
                            {/* ✅ Sector dropdown is disabled if Role is HOD */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Sector</label>
                                <select 
                                      value={form.sector || ""} 
                                    onChange={e => setForm({...form, sector: e.target.value})} 
                                    disabled={form.role === "Head of Department (HOD)"}
                                    className={`w-full border p-2 rounded-lg text-sm outline-none ${form.role === "Head of Department (HOD)" ? "bg-gray-100 border-gray-200 opacity-70" : "bg-white border-gray-200 focus:border-[#103c7f]"}`}
                                >
                                    <option value="">- Select -</option>
                                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
<div>
                                <label className="text-[10px] font-bold text-purple-600 uppercase">Employee Name</label>
                              <select 
  value={form.assignedTo || ""} 
  onChange={handleEmployeeChange} 
  disabled={users.length === 0} 
  className="w-full border border-purple-200 p-2 rounded-lg text-sm outline-none bg-purple-50 focus:border-purple-500 disabled:opacity-50"
>
  <option value="">- Select Name -</option>

  {users.map((user) => (
    <option key={user.user_id} value={user.user_id}>
      {user.name} ({user.role})
    </option>
  ))}
</select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-4">
                        {form.targetList.map((t, index) => (
                            <div key={index} className="border border-blue-100 rounded-xl p-4 bg-white shadow-sm relative group">
                                
                                {!editId && form.targetList.length > 1 && (
                                    <button onClick={() => removeTargetRow(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Remove this KPI">
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                        {editId ? "KPI Details" : `Target Metric #${index + 1}`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">KPI Metric</label>
                                        <select value={t.kpi_metric} onChange={e => handleTargetChange(index, 'kpi_metric', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50">
                                            <option value="">- Select Metric -</option>
                                            {kpiMetrics.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Frequency</label>
                                        <select value={t.frequency} onChange={e => handleTargetChange(index, 'frequency', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50">
                                            <option value="Daily">Daily</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-blue-600 uppercase">Total Target Value</label>
                                        <input type="number" placeholder="E.g. 50 or 5000000" value={t.target} onChange={e => handleTargetChange(index, 'target', e.target.value)} className="w-full border border-blue-200 p-2 rounded-lg text-sm font-black outline-none focus:border-blue-600 bg-blue-50 text-[#103c7f]"/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Guideline / Specific Instructions</label>
                                    <textarea rows="2" placeholder="Write specific instructions or focus areas for this KPI..." value={t.guideline} onChange={e => handleTargetChange(index, 'guideline', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50 resize-none"></textarea>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!editId && (
                        <div className="flex justify-center mb-6">
                            <button onClick={addTargetRow} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm">
                                <Plus size={14}/> Add Another Custom KPI
                            </button>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <button onClick={handleSaveTarget} className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-md flex items-center justify-center gap-2 transition-colors text-xs ${activeDeptTab === 'Sales' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#103c7f] hover:bg-blue-900'}`}>
                            <Save size={16}/> {editId ? "Update Assigned Target" : `Save & Assign`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW TARGET MODAL --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <Eye size={16}/> Target Breakdown
                    </h3>
                    <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>
                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl mb-5">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Leader Role</p>
                            <p className="text-sm font-bold text-[#103c7f] flex items-center gap-1.5"><Briefcase size={14}/> {viewData.role}</p>
                            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase">Assigned To: {viewData.assignedTo}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">KPI Metric</p>
                            <p className="text-sm font-bold text-indigo-700 flex items-center justify-end gap-1.5"><BarChart2 size={14}/> {viewData.kpi_metric}</p>
                        </div>
                    </div>

                    {/* COMING SOON MESSAGE */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
                        <Layers size={32} className="text-gray-300 mb-3" />
                        <h4 className="text-sm font-black text-gray-600 uppercase tracking-widest">Breakdown Coming Soon</h4>
                        <p className="text-[11px] font-bold text-gray-400 mt-2 max-w-xs leading-relaxed">
                            Detailed team member breakdown for this KPI will be available in the next update.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}