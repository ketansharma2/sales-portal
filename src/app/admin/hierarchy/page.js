"use client";
import { useState } from "react";
import { 
    GitMerge, UserPlus, Users, Building2, Rocket, 
    BadgeCheck, User, CheckCircle2, Edit, Save, Trash2, ShieldCheck
} from "lucide-react";

export default function HierarchyPage() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState("visual"); // 'visual' | 'manage'
    
    // Mock Data for Editable Directory
    const [employees, setEmployees] = useState([
        { id: 1, name: "Amit Sharma", dept: "Sales", sector: "Corporate", role: "HOD", reportsTo: "Director", status: "Active" },
        { id: 2, name: "Neha Gupta", dept: "Sales", sector: "Corporate", role: "SM", reportsTo: "Amit Sharma", status: "Active" },
        { id: 3, name: "Khushi Chawla", dept: "Sales", sector: "Corporate", role: "Leadgen", reportsTo: "Neha Gupta", status: "Active" },
        { id: 4, name: "Pooja Sharma", dept: "Delivery", sector: "Corporate", role: "CRM", reportsTo: "Director", status: "Active" },
        { id: 5, name: "Sanjay Dutt", dept: "Delivery", sector: "Corporate", role: "TL", reportsTo: "Pooja Sharma", status: "Active" },
    ]);

    const [editingId, setEditingId] = useState(null);

    // --- RENDER VISUAL TREE (TAB 1) ---
    const renderVisualTree = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {/* 1. SALES DEPARTMENT TREE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sales Department</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active: 24</p>
                        </div>
                    </div>
                </div>

                {/* Corporate Sector Branch */}
                <div className="mb-6">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest border border-indigo-100">Corporate Sector</span>
                    
                    <div className="mt-3 ml-2 border-l-2 border-indigo-200 pl-4 relative">
                        <div className="absolute w-4 h-0.5 bg-indigo-200 -left-[2px] top-4"></div>
                        <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BadgeCheck size={16} className="text-indigo-600"/>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800">Amit Sharma</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">HOD - Corporate Sales</p>
                                </div>
                            </div>
                        </div>

                        {/* SM Level */}
                        <div className="ml-4 border-l-2 border-slate-200 pl-4 relative space-y-3">
                            <div className="relative">
                                <div className="absolute w-4 h-0.5 bg-slate-200 -left-[18px] top-4"></div>
                                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-2">
                                    <User size={14} className="text-slate-500"/>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800">Neha Gupta</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Sales Manager (SM)</p>
                                    </div>
                                </div>

                                {/* Executives Level */}
                                <div className="ml-4 border-l-2 border-slate-100 pl-4 mt-2 space-y-2 relative">
                                    <div className="flex items-center gap-2 relative">
                                        <div className="absolute w-4 h-px bg-slate-200 -left-[18px] top-1/2"></div>
                                        <div className="bg-white border border-slate-100 p-1.5 rounded flex-1 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-700">Khushi Chawla <span className="text-[8px] text-slate-400 ml-1">(Leadgen)</span></p>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DELIVERY DEPARTMENT TREE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <Rocket size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delivery Department</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active: 18</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded uppercase tracking-widest border border-purple-100">Corporate Sector</span>
                    
                    <div className="mt-3 ml-2 border-l-2 border-purple-200 pl-4 relative">
                        <div className="absolute w-4 h-0.5 bg-purple-200 -left-[2px] top-4"></div>
                        <div className="bg-purple-50/50 border border-purple-100 p-2.5 rounded-lg flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BadgeCheck size={16} className="text-purple-600"/>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800">Pooja Sharma</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">CRM</p>
                                </div>
                            </div>
                        </div>

                        <div className="ml-4 border-l-2 border-slate-200 pl-4 relative space-y-3">
                            <div className="relative">
                                <div className="absolute w-4 h-0.5 bg-slate-200 -left-[18px] top-4"></div>
                                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-2">
                                    <User size={14} className="text-slate-500"/>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800">Sanjay Dutt</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Team Lead (TL)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- RENDER EDITABLE DIRECTORY (TAB 2) ---
    const renderManageDirectory = () => (
        <div className="animate-in fade-in duration-500 space-y-6">
            
            {/* Quick Add Form */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserPlus size={16} className="text-emerald-600"/> Add New Employee
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                        <input type="text" placeholder="e.g. Rahul Verma" className="w-full text-xs font-bold text-slate-700 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Department</label>
                        <select className="w-full text-xs font-bold text-slate-700 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                            <option>Sales</option>
                            <option>Delivery</option>
                            <option>HR</option>
                            <option>Tech</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Sector</label>
                        <select className="w-full text-xs font-bold text-slate-700 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                            <option>Corporate</option>
                            <option>Domestic</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Role & Manager</label>
                        <select className="w-full text-xs font-bold text-slate-700 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                            <option>FSE (Reports to Neha Gupta)</option>
                            <option>Leadgen (Reports to Neha Gupta)</option>
                            <option>SM (Reports to Amit Sharma)</option>
                        </select>
                    </div>
                    <div>
                        <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg transition-colors">
                            + Create User
                        </button>
                    </div>
                </div>
            </div>

            {/* Editable Data Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-600"/> Active Directory (Editable)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</th>
                                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector & Role</th>
                                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports To</th>
                                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 text-xs font-bold text-slate-800">
                                        {editingId === emp.id ? (
                                            <input type="text" defaultValue={emp.name} className="border border-slate-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500" />
                                        ) : emp.name}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-slate-600">
                                        {editingId === emp.id ? (
                                            <select defaultValue={emp.dept} className="border border-slate-300 rounded px-2 py-1 w-full outline-none">
                                                <option>Sales</option><option>Delivery</option>
                                            </select>
                                        ) : emp.dept}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-slate-600">
                                        {editingId === emp.id ? (
                                            <div className="flex gap-1">
                                                <select defaultValue={emp.sector} className="border border-slate-300 rounded px-1 py-1 w-1/2 outline-none text-[10px]">
                                                    <option>Corporate</option><option>Domestic</option>
                                                </select>
                                                <select defaultValue={emp.role} className="border border-slate-300 rounded px-1 py-1 w-1/2 outline-none text-[10px]">
                                                    <option>HOD</option><option>SM</option><option>FSE</option><option>Leadgen</option><option>CRM</option><option>TL</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{emp.sector} | {emp.role}</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-slate-600">
                                        {editingId === emp.id ? (
                                            <input type="text" defaultValue={emp.reportsTo} className="border border-slate-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500" />
                                        ) : emp.reportsTo}
                                    </td>
                                    <td className="p-3 flex justify-center gap-2">
                                        {editingId === emp.id ? (
                                            <button onClick={() => setEditingId(null)} className="w-7 h-7 bg-green-100 text-green-600 rounded flex items-center justify-center hover:bg-green-200">
                                                <Save size={14} />
                                            </button>
                                        ) : (
                                            <button onClick={() => setEditingId(emp.id)} className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center hover:bg-blue-100">
                                                <Edit size={14} />
                                            </button>
                                        )}
                                        <button className="w-7 h-7 bg-rose-50 text-rose-600 rounded flex items-center justify-center hover:bg-rose-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
            
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <Users size={24} className="text-blue-600"/> Org Matrix & Access
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage Roles, Departments & Hierarchies</p>
                </div>
            </div>

            {/* --- CUSTOM TABS --- */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab("visual")}
                    className={`px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeTab === "visual"
                        ? 'bg-[#103c7f] text-white shadow-md'
                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0'
                    }`}
                >
                    <GitMerge size={16} /> Visual Hierarchy
                </button>
                <button
                    onClick={() => setActiveTab("manage")}
                    className={`px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeTab === "manage"
                        ? 'bg-[#103c7f] text-white shadow-md'
                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0'
                    }`}
                >
                    <ShieldCheck size={16} /> Manage Directory
                </button>
            </div>

            {/* --- TAB CONTENT --- */}
            <div className="min-h-[500px]">
                {activeTab === "visual" ? renderVisualTree() : renderManageDirectory()}
            </div>

        </div>
    );
}