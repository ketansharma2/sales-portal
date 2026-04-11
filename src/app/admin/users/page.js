"use client";

import { useState } from "react";
import { Users, UserPlus, X, Trash2, Edit } from "lucide-react";

const ROLE_ABBREVIATIONS = {
  TL: "AD",
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

const DUMMY_USERS = [
  {
    id: 1,
    name: "Raj Sharma",
    email: "raj@example.com",
    password: "123456",
    roles: ["LEADGEN", "CRM"],
    sector: "Corporate",
    manager: "Manager A",
    tl: "TL A",
    region: "NORTH",
  },
  {
    id: 2,
    name: "Priya Verma",
    email: "priya@example.com",
    password: "123456",
    roles: ["TL", "MANAGER"],
    sector: "Domestic",
    manager: "Manager B",
    tl: "TL B",
    region: "SOUTH",
  },
];

export default function UserManagementDemo() {
  const [users, setUsers] = useState(DUMMY_USERS);

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

  /* ---------------- CHANGE HANDLERS ---------------- */

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    setEditingId(user.id);

    setForm({
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.roles,
      sector: user.sector,
      manager: user.manager,
      tl: user.tl,
      region: user.region,
    });
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = () => {
    if (mode === "create") {
      setUsers((prev) => [
        { ...form, id: Date.now() },
        ...prev,
      ]);
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId ? { ...u, ...form } : u
        )
      );
    }

    setOpen(false);
  };

  /* ---------------- DELETE ---------------- */

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-2 h-screen flex flex-col bg-gray-50 font-['Calibri']">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-2xl font-black text-[#103c7f] uppercase flex items-center gap-2">
            <Users size={22} /> User Management
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase">
            Total Users: {users.length}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-[#103c7f] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* TABLE */}
<div className="bg-white rounded-xl overflow-auto flex-1">
  <table className="w-full text-sm table-fixed">

    <thead className="bg-[#103c7f] text-white text-xs uppercase">
      <tr>
        <th className="p-2 text-left w-[160px]">Name</th>
        <th className="p-2 text-left w-[220px]">Email</th>
        <th className="p-2 w-[180px]">Roles</th>
        <th className="p-2 w-[120px]">Sector</th>
        <th className="p-2 w-[140px]">Manager</th>
        <th className="p-2 w-[120px]">TL</th>
        <th className="p-2 w-[120px]">Region</th>
        <th className="p-2 w-[100px]">Action</th>
      </tr>
    </thead>

    <tbody>
      {users.map((u) => (
        <tr
          key={u.id}
          className="border-b border-gray-100 hover:bg-gray-50 transition"
        >

          <td className="p-2 font-bold text-[#103c7f] truncate">
            {u.name}
          </td>

          <td className="p-2 truncate">{u.email}</td>

          <td className="p-2">
            <div className="flex flex-wrap gap-1 justify-center">
              {u.roles.map((r) => (
                <span
                  key={r}
                  className="text-[10px] bg-blue-100 px-2 py-0.5 rounded whitespace-nowrap"
                >
                  {ROLE_ABBREVIATIONS[r]}
                </span>
              ))}
            </div>
          </td>

          <td className="p-2 text-center">{u.sector}</td>
          <td className="p-2 text-center">{u.manager}</td>
          <td className="p-2 text-center">{u.tl}</td>
          <td className="p-2 text-center">{u.region}</td>

          {/* ACTION FIXED ALIGN */}
          <td className="p-2">
            <div className="flex justify-center items-center gap-2">

              <button
                onClick={() => openEdit(u)}
                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                <Edit size={14} />
              </button>

              <button
                onClick={() => deleteUser(u.id)}
                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                <Trash2 size={14} />
              </button>

            </div>
          </td>

        </tr>
      ))}
    </tbody>

  </table>
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

              <Input label="Name" value={form.name}
                onChange={(e) => handleChange("name", e.target.value)} />

              <Input label="Email" value={form.email}
                onChange={(e) => handleChange("email", e.target.value)} />

              <Input label="Password" type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)} />

              {/* ROLES */}
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Roles
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
                  options={MANAGERS}
                  onChange={(v) => handleChange("manager", v)}
                />

                <Select label="TL"
                  value={form.tl}
                  options={TLS}
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
                className="bg-[#103c7f] text-white px-5 py-2 rounded-xl font-bold"
              >
                {mode === "create" ? "Save User" : "Update User"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* INPUT */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">
        {label}
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
function Select({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1
focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#103c7f]"
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}