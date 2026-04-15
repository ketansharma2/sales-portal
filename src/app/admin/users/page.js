"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, X, Trash2, Edit, Eye, EyeOff } from "lucide-react";

const ROLE_ABBREVIATIONS = {
  TL: "TL",
  RC: "RC",
  CRM: "CRM",
  FSE: "FSE",
  LEADGEN: "LEADGEN",
  MANAGER: "MANAGER",
  JOBPOST: "JOBPOST",
};

const ROLES = Object.keys(ROLE_ABBREVIATIONS);
const SECTORS = ["Corporate", "Domestic"];
const REGIONS = ["NORTH", "SOUTH", "EAST", "WEST"];

const MANAGERS = ["Manager A", "Manager B"];
const TLS = ["TL A", "TL B"];

export default function UserManagementDemo() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [allManagers, setAllManagers] = useState([]);
  const [allTLs, setAllTLs] = useState([]);

  useEffect(() => {
    const fetchManagersTLs = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        if (data.success) {
          const mgrs = (data.data || []).filter(u => (u.role || []).includes('MANAGER'));
          const tls = (data.data || []).filter(u => (u.role || []).includes('TL'));
          setAllManagers(mgrs);
          setAllTLs(tls);
        }
      } catch (error) {
        console.error('Failed to fetch managers/tls:', error);
      }
    };
    fetchManagersTLs();
  }, []);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roles: [],
    sector: "",
    manager: "",
    tl: "",
    region: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredManagers = form.sector && form.sector !== "All" 
    ? allManagers.filter(m => m.sector === form.sector)
    : allManagers;
  
  const filteredTLs = form.sector && form.sector !== "All"
    ? allTLs.filter(t => t.sector === form.sector)
    : allTLs;

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || (u.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === "All" || u.sector === filterSector;
    const matchesRole = filterRole === "All" || (u.role || []).includes(filterRole);
    return matchesSearch && matchesSector && matchesRole;
  });

  /* ---------------- CHANGE HANDLERS ---------------- */

  const handleChange = (key, value) => {
    if (key === 'sector') {
      setForm((prev) => ({ ...prev, [key]: value, manager: "", tl: "" }));
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  /* ---------------- OPEN CREATE ---------------- */

  const openCreate = () => {
    setOpen(true);
    setMode("create");
    setEditingId(null);

    setForm({
      name: "",
      email: "",
      password: "",
      roles: [],
      sector: "",
      manager: "",
      tl: "",
      region: "",
    });
  };

  /* ---------------- OPEN EDIT ---------------- */

  const openEdit = (user) => {
    setOpen(true);
    setMode("edit");
    setEditingId(user.user_id);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      roles: user.role || [],
      sector: user.sector || "",
      manager: user.manager_id || "",
      tl: user.tl_id || "",
      region: user.region || "",
    });
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (mode === "create") {
      if (!form.name || !form.email || !form.password || form.roles.length === 0) {
        alert("Please fill all required fields (Name, Email, Password, Role)");
        return;
      }
    } else {
      if (!form.name || !form.email || form.roles.length === 0) {
        alert("Please fill all required fields (Name, Email, Role)");
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const session = JSON.parse(localStorage.getItem('session') || '{}');
    
    if (mode === "create") {
      // POST for create
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await response.json();
        if (data.success) {
          setUsers(prev => [{ ...form, role: form.roles, user_id: data.data?.user_id }, ...prev]);
          setOpen(false);
        } else {
          alert(data.error || "Failed to create user");
        }
      } catch (error) {
        console.error('Create error:', error);
        alert("Failed to create user");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // PUT for edit - map roles to role for API
      const putData = { 
        user_id: editingId, 
        name: form.name, 
        sector: form.sector, 
        role: form.roles,
        manager_id: form.manager || null,
        tl_id: form.tl || null
      }
      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(putData)
        });
        const data = await response.json();
        if (data.success) {
          setUsers(prev => prev.map(u => u.user_id === editingId ? { ...u, ...form } : u));
          setOpen(false);
        } else {
          alert(data.error || "Failed to update user");
        }
      } catch (error) {
        console.error('Update error:', error);
        alert("Failed to update user");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-2  flex flex-col bg-gray-100 font-['Calibri']  ">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-2xl font-black text-[#103c7f] uppercase flex items-center gap-2">
            <Users size={22} /> User Management
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase">
            Total Users: {filteredUsers.length} / {users.length}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-[#103c7f] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-3 max-w-[35vw] ml-9 bg-white p-2 rounded-lg">
      
        <div className="w-48">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
          />
        </div>
        <div className="w-36">
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
          >
            <option value="All">All Sectors</option>
            <option value="Corporate">Corporate</option>
            <option value="Domestic">Domestic</option>
          </select>
        </div>
        <div className="w-36">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
          >
            <option value="All">All Roles</option>
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
<div className="flex justify-center">
  <div className="bg-white rounded-xl mb-8 w-[95%] ">
  <table className="w-full text-sm table-fixed">

    <thead className="bg-[#103c7f] text-white text-xs uppercase">
      <tr>
        <th className="p-2 text-left w-[160px]">Name</th>
        <th className="p-2 text-left w-[220px]">Email</th>
        <th className="p-2 w-[180px]">Roles</th>
        <th className="p-2 w-[120px]">Sector</th>
        <th className="p-2 w-[140px]">Manager</th>
        <th className="p-2 w-[120px]">TL</th>
        <th className="p-2 w-[100px]">Action</th>
      </tr>
    </thead>

    <tbody>
      {loading && (
        <tr>
          <td colSpan={7} className="p-8 text-center text-gray-500">
            Loading users...
          </td>
        </tr>
      )}
      {!loading && filteredUsers.length === 0 && (
        <tr>
          <td colSpan={7} className="p-8 text-center text-gray-500">
            No users found
          </td>
        </tr>
      )}
      {!loading && filteredUsers.length > 0 && filteredUsers.map((u) => (
        <tr
          key={u.user_id}
          className="border-b border-gray-100 hover:bg-gray-50 transition"
        >
          <td className="p-2 font-bold text-[#103c7f] truncate">
            {u.name}
          </td>
          <td className="p-2 truncate">{u.email}</td>
          <td className="p-2">
            <div className="flex flex-wrap gap-1 justify-center">
              {(u.role || []).map((r) => (
                <span
                  key={r}
                  className="text-[10px] bg-blue-100 font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                >
                  {ROLE_ABBREVIATIONS[r] || r}
                </span>
              ))}
            </div>
          </td>
          <td className="p-2 text-center">{u.sector || "-"}</td>
          <td className="p-2 text-center">{u.manager_name || "-"}</td>
          <td className="p-2 text-center">{u.tl_name || "-"}</td>
          <td className="p-2">
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => openEdit(u)}
                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                <Edit size={14} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>

  </table>
</div>
</div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">

            {/* HEADER */}
            <div className="flex justify-between items-center p-4 bg-[#103c7f] text-white">
              <h2 className="font-black uppercase">
                {mode === "create" ? "Create User" : "Edit User"}
              </h2>

              <button onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">

              <Input label="Name" required value={form.name}
                onChange={(e) => handleChange("name", e.target.value)} />

              {mode === "create" ? (
                <Input label="Email" required value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)} />
                ) : (
                <Input label="Email" value={form.email} disabled />
                )}

              {mode === "create" ? (
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#103c7f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Password
                </label>
                <input
                  disabled
                  value="●●●●●●●●●"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 text-gray-500 disabled"
                />
                {/* <p className="text-[10px] text-gray-400 mt-1">Contact admin to change password</p> */}
              </div>
            )}

              {/* ROLES */}
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Roles <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1 text-xs rounded-full border font-bold transition ${
                        form.roles.includes(role)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      {ROLE_ABBREVIATIONS[role]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <Select label="Sector"
                  value={form.sector}
                  options={SECTORS}
                  onChange={(v) => handleChange("sector", v)}
                />

                <Select label="Manager"
                  value={form.manager}
                  options={filteredManagers.map(m => m.user_id)}
                  optionLabels={filteredManagers.map(m => m.name)}
                  onChange={(v) => handleChange("manager", v)}
                />

                <Select label="TL"
                  value={form.tl}
                  options={filteredTLs.map(t => t.user_id)}
                  optionLabels={filteredTLs.map(t => t.name)}
                  onChange={(v) => handleChange("tl", v)}
                />

                <Select label="Region"
                  value={form.region}
                  options={REGIONS}
                  onChange={(v) => handleChange("region", v)}
                />

              </div>

            </div>

            {/* FOOTER */}
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">

              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 font-bold text-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#103c7f] disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold"
              >
                {isSubmitting ? "Saving..." : (mode === "create" ? "Save User" : "Update User")}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* INPUT */
function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1
focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#103c7f]"
      />
    </div>
  );
}

/* SELECT */
function Select({ label, options, value, onChange, optionLabels, required }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1
focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#103c7f]"
      >
        <option value="">Select {label}</option>
        {options.map((o, i) => (
          <option key={o} value={o}>
            {optionLabels ? optionLabels[i] : o}
          </option>
        ))}
      </select>
    </div>
  );
}