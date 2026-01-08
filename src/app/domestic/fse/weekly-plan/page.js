"use client";
import { useState, useEffect } from "react";
import { 
  Calendar, MapPin, Navigation, Phone, Menu, 
  ChevronRight, CheckSquare, Info, X, User, Clock 
} from "lucide-react";

export default function FseDashboard() {
  
  // --- DYNAMIC DATES SETUP ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const toIsoString = (date) => date.toISOString().split('T')[0];

  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(today); 
  const [selectedWeek, setSelectedWeek] = useState(1); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [selectedTask, setSelectedTask] = useState(null);

  // --- TASK STATE (Converted to State for Updates) ---
  const [tasks, setTasks] = useState([
    {
      id: 1,
      date: toIsoString(today),
      company: "Alpha Tech Solutions",
      category: "IT Services",
      location: "Okhla Ph-3",
      state: "Delhi",
      empCount: "50-100",
      contactPerson: "Mr. Verma",
      phone: "9876543210",
      latestRemark: "Client interested in demo.",
      status: "Scheduled",
      subStatus: "Visit Planned",
      visitOutcome: null // New Field for the last column
    },
    {
      id: 2,
      date: toIsoString(today),
      company: "Star Logistics",
      category: "Logistics",
      location: "Nehru Place",
      state: "Delhi",
      empCount: "10-50",
      contactPerson: "Reception",
      phone: "9988007766",
      latestRemark: "Drop proposal hardcopy.",
      status: "Scheduled",
      subStatus: "Drop Doc",
      visitOutcome: null
    },
    {
      id: 3,
      date: toIsoString(today),
      company: "Green Field Estates",
      category: "Real Estate",
      location: "Sec-44",
      state: "Gurgaon",
      empCount: "100+",
      contactPerson: "Ms. Kaur",
      phone: "9988776655",
      latestRemark: "Collect cheque.",
      status: "Rescheduled",
      subStatus: "Next Week",
      visitOutcome: "Rescheduled" // Pre-filled example
    }
  ]);

  // --- HELPER: Get Weeks ---
  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let currentWeek = 1;
    let currentStartDate = new Date(firstDay);

    while (currentStartDate <= lastDay) {
        const dayOfWeek = currentStartDate.getDay();
        const diffToSunday = 7 - (dayOfWeek === 0 ? 7 : dayOfWeek); 
        let endOfWeek = new Date(currentStartDate);
        endOfWeek.setDate(currentStartDate.getDate() + diffToSunday);
        if (endOfWeek > lastDay) endOfWeek = lastDay;
        weeks.push({ weekNum: currentWeek, start: new Date(currentStartDate), end: new Date(endOfWeek) });
        currentStartDate = new Date(endOfWeek);
        currentStartDate.setDate(currentStartDate.getDate() + 1);
        currentWeek++;
    }
    return weeks;
  };

  const allWeeks = getWeeksInMonth(currentYear, currentMonth);

  useEffect(() => {
    const week = allWeeks.find(w => today >= w.start && today <= w.end);
    if(week) setSelectedWeek(week.weekNum);
  }, []);

  const getDaysForWeek = (weekObj) => {
      if(!weekObj) return [];
      const days = [];
      let d = new Date(weekObj.start);
      while (d <= weekObj.end) {
          days.push(new Date(d));
          d.setDate(d.getDate() + 1);
      }
      return days;
  };

  const weekDays = getDaysForWeek(allWeeks[selectedWeek - 1] || allWeeks[0]);
  const managerName = "Suresh Kumar"; 

  // Filter Tasks
  const selectedDateString = toIsoString(currentDate);
  const todaysTasks = tasks.filter(task => task.date === selectedDateString);

  // --- HANDLERS ---
  const openModal = (task, type) => {
      setSelectedTask(task);
      setModalType(type);
      setIsModalOpen(true);
  }

  // 👉 UPDATE LOGIC
  const handleUpdateSubmit = (outcome) => {
      const updatedTasks = tasks.map(t => 
          t.id === selectedTask.id ? { ...t, visitOutcome: outcome } : t
      );
      setTasks(updatedTasks);
      setIsModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] pb-20">
      
      {/* 1. TOP HEADER */}
      <div className="bg-[#103c7f] text-white pt-4 px-4 pb-2 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-4">
           <div>
              <h1 className="text-xl font-black uppercase tracking-wide">
                 {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h1>
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Weekly Planner</p>
           </div>
           <button className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <Menu size={20} />
           </button>
        </div>

        <div className="flex bg-[#0d316a] p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar">
           {allWeeks.map((week) => (
              <button 
                 key={week.weekNum}
                 onClick={() => setSelectedWeek(week.weekNum)}
                 className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition whitespace-nowrap px-3 ${
                    selectedWeek === week.weekNum ? 'bg-white text-[#103c7f] shadow-sm' : 'text-white/60 hover:text-white'
                 }`}
              >
                 Week {week.weekNum}
              </button>
           ))}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
           {weekDays.map((date, idx) => {
              const dateStr = toIsoString(date);
              const isActive = dateStr === selectedDateString;
              const isToday = toIsoString(today) === dateStr;
              return (
                 <button 
                    key={idx}
                    onClick={() => setCurrentDate(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl transition border-2 ${
                       isActive ? 'bg-white text-[#103c7f] border-white shadow-lg scale-105 z-10' : 'bg-[#103c7f] text-white border-white/10'
                    }`}
                 >
                    <span className="text-[9px] uppercase font-bold opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-xl font-black leading-none mt-0.5">{date.getDate()}</span>
                    {isToday && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shadow-sm"></span>}
                 </button>
              )
           })}
        </div>
      </div>

      {/* 2. TABLE CONTENT */}
      <div className="p-4 -mt-2">
         
         <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-t-xl border-b border-blue-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
               <User size={12} className="text-[#103c7f]" /> Assigned by: <span className="text-[#103c7f]">{managerName}</span>
            </span>
            <span className="text-[10px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
               {todaysTasks.length} Visits
            </span>
         </div>

         <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                  <tr>
                     <th className="px-3 py-3 min-w-[120px]">Client</th>
                     <th className="px-3 py-3 min-w-[100px]">Location</th>
                     <th className="px-3 py-3 min-w-[150px]">Latest Remark</th>
                     <th className="px-3 py-3 text-center min-w-[90px]">Status</th>
                     <th className="px-3 py-3 text-center min-w-[80px]">Action</th>
                     {/* 👉 NEW COLUMN */}
                     <th className="px-3 py-3 text-center min-w-[120px] bg-blue-50/30 text-[#103c7f]">Visit Status</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                  {todaysTasks.length > 0 ? (
                     todaysTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-blue-50/10 transition group">
                           
                           <td className="px-3 py-3 align-top">
                              <div className="font-bold text-[#103c7f] text-sm leading-tight">{task.company}</div>
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">{task.category}</span>
                           </td>

                           <td className="px-3 py-3 align-top">
                              <div className="flex items-start gap-1 font-medium">
                                 <MapPin size={12} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                 <span>{task.location}<br/><span className="text-[9px] text-gray-400 uppercase">{task.state}</span></span>
                              </div>
                           </td>

                           <td className="px-3 py-3 align-top">
                              <p className="italic text-gray-500 text-[11px] leading-relaxed line-clamp-2" title={task.latestRemark}>
                                 "{task.latestRemark}"
                              </p>
                           </td>

                           <td className="px-3 py-3 align-top text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border mb-1 ${
                                 task.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                                 {task.status}
                              </span>
                              <div className="text-[9px] text-gray-400 font-medium">{task.subStatus}</div>
                           </td>

                           {/* Actions */}
                           <td className="px-3 py-3 align-top text-center">
                              <div className="flex justify-center gap-2">
                                 <button onClick={() => openModal(task, 'view_details')} className="p-1.5 bg-gray-50 hover:bg-white text-gray-500 hover:text-[#103c7f] border border-gray-200 rounded transition shadow-sm" title="View Details">
                                    <Info size={14} />
                                 </button>
                                 <button onClick={() => openModal(task, 'update_status')} className="p-1.5 bg-[#103c7f] text-white rounded shadow-md hover:bg-blue-900 transition active:scale-95" title="Update Status">
                                    <CheckSquare size={14} />
                                 </button>
                              </div>
                           </td>

                           {/* 👉 NEW COLUMN: VISIT STATUS */}
                           <td className="px-3 py-3 align-top text-center bg-blue-50/10">
                              {task.visitOutcome ? (
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold border block w-full ${
                                    task.visitOutcome === 'Visit Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                    task.visitOutcome === 'Reschedule' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                                 }`}>
                                    {task.visitOutcome}
                                 </span>
                              ) : (
                                 <span className="text-gray-300 text-xs font-bold">-</span>
                              )}
                           </td>

                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400 text-xs font-bold uppercase">
                           <div className="flex flex-col items-center gap-2">
                              <Calendar size={24} className="opacity-20"/>
                              No visits scheduled
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- MODALS --- */}
      {isModalOpen && selectedTask && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
               
               <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold text-lg uppercase tracking-wide">
                     {modalType === 'view_details' ? 'Company Details' : 'Update Visit Status'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
               </div>

               {/* 1. VIEW DETAILS */}
               {modalType === 'view_details' && (
                  <div className="p-6 space-y-4">
                     <div>
                        <h2 className="text-xl font-black text-[#103c7f] leading-none mb-1">{selectedTask.company}</h2>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selectedTask.category}</span>
                     </div>
                     <div className="space-y-3 pt-2">
                        <p className="text-xs text-gray-600 flex items-center gap-2"><MapPin size={14} className="text-[#103c7f]"/> {selectedTask.location}, {selectedTask.state}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-2"><User size={14} className="text-[#103c7f]"/> {selectedTask.contactPerson} ({selectedTask.phone})</p>
                        <p className="text-xs text-gray-600 flex items-center gap-2"><Info size={14} className="text-[#103c7f]"/> {selectedTask.empCount} Employees</p>
                     </div>
                     
                  </div>
               )}

               {/* 2. UPDATE STATUS */}
               {modalType === 'update_status' && (
                  <div className="p-5 grid gap-3">
                     <button onClick={() => handleUpdateSubmit('Visit Completed')} className="p-3 border rounded-xl flex items-center justify-between hover:bg-green-50 hover:border-green-500 group"><span className="font-bold text-gray-700 group-hover:text-green-700">Visit Completed</span><ChevronRight size={16} className="text-gray-300 group-hover:text-green-500"/></button>
                     <button onClick={() => handleUpdateSubmit('Reschedule')} className="p-3 border rounded-xl flex items-center justify-between hover:bg-orange-50 hover:border-orange-500 group"><span className="font-bold text-gray-700 group-hover:text-orange-700">Reschedule</span><ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500"/></button>
                     <button onClick={() => handleUpdateSubmit('Client Not Available')} className="p-3 border rounded-xl flex items-center justify-between hover:bg-red-50 hover:border-red-500 group"><span className="font-bold text-gray-700 group-hover:text-red-700">Client Not Available</span><ChevronRight size={16} className="text-gray-300 group-hover:text-red-500"/></button>
                  </div>
               )}

            </div>
         </div>
      )}

    </div>
  );
}