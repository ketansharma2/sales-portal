    "use client";
import { useState, useEffect } from "react";
import { 
  Check, X, ShieldCheck, UserCircle, Search, Download, 
  Clock, FileText, CheckCircle, ArrowRightCircle, Building2 
} from "lucide-react";

export default function ManagerApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const fetchPendingExpenses = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/manager/approvals/pending-expenses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/manager/fse-team', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTeamCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch team count:', error);
    }
  };

  useEffect(() => {
    fetchPendingExpenses();
    fetchTeamCount();
  }, []);

  const handleApprove = async (exp_id) => {
    console.log('Approving expense:', exp_id);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      console.log('Session:', session);
      const response = await fetch('/api/domestic/manager/approvals/approve-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exp_id })
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      if (data.success) {
        fetchPendingExpenses(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const handleReject = async (exp_id) => {
    console.log('Rejecting expense:', exp_id);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      console.log('Session:', session);
      const response = await fetch('/api/domestic/manager/approvals/reject-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exp_id })
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      if (data.success) {
        fetchPendingExpenses(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const handleSendToHR = async (exp_id) => {
    console.log('Sending expense to HR:', exp_id);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/manager/approvals/send-to-hr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exp_id })
      });
      const data = await response.json();
      if (data.success) {
        fetchPendingExpenses(); // Refresh the list
      } else {
        alert(data.error || 'Failed to send to HR');
      }
    } catch (error) {
      console.error('Failed to send to HR:', error);
      alert('Failed to send to HR');
    }
  };

  return (
<div className="h-[calc(100vh-4rem)] bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden">      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[16px] p-4 mb-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#103c7f] p-3 rounded-[14px] shadow-lg shadow-[#103c7f]/20">
            <ShieldCheck size={24} className="text-[#a1db40]" strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
              Team Approvals
            </h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1.5 uppercase flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
               Current Month Approvals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-[14px] border border-gray-100">
           <div className="flex items-center px-3 gap-2 border-r border-gray-200">
             <Search size={16} className="text-gray-300"/>
             <input type="text" placeholder="Search FSE..." className="bg-transparent text-[10px] font-bold text-[#103c7f] outline-none w-28" />
           </div>
           <button className="bg-[#103c7f] text-[#a1db40] px-4 py-2 rounded-[10px] font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-[#0d316a] transition-all">
             <Download size={12} /> Report
           </button>
        </div>
      </div>

      {/* CLAIMS TABLE */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-[#103c7f] text-white z-10 text-[10px] uppercase font-black tracking-[0.1em]">
              <tr>
                <th className="px-5 py-3.5">Field Executive</th>
                <th className="px-5 py-3.5">Expense Category & Notes</th>
                <th className="px-5 py-3.5 text-center">Amount</th>
                <th className="px-5 py-3.5 text-center">Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            
            <tbody className="text-sm">
              {approvals.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50 transition-all group">
                  
                  {/* Name Column */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${item.img}`}>
                        <UserCircle size={22} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-black text-[#103c7f] text-sm leading-none tracking-tight">{item.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#a1db40]"></span> {item.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Details Column */}
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-700 uppercase tracking-tight text-[11px] mb-0.5">{item.category}</span>
                        <span className="text-[11px] font-bold text-gray-400 italic">"{item.notes}"</span>
                    </div>
                  </td>
                  
                  {/* Amount Column */}
                  <td className="px-5 py-3 text-center">
                    <p className="text-lg font-black text-[#103c7f] italic leading-none">₹{item.amount}</p>
                  </td>
                  
                  {/* Date Column */}
                  <td className="px-5 py-3 text-center font-black text-gray-400 text-[11px]">
                    {item.date}
                  </td>
                  
                  {/* Status Column (UPDATED LOGIC: "Sent to HR" is Blue/Indigo, Approved/Rejected added) */}
                  <td className="px-5 py-3 text-center">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 w-fit mx-auto
                      ${item.status === 'Sent to HR'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' // Blue/Indigo for HR Handoff
                        : item.status === 'Clarification Req'
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                          : item.status === 'Approved'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : item.status === 'Rejected'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-orange-50 text-orange-600 border-orange-100'}`}>

                      {item.status === 'Pending Review' && <Clock size={10} />}
                      {/* Using Building Icon for HR */}
                      {item.status === 'Sent to HR' && <Building2 size={10} />}
                      {item.status === 'Approved' && <CheckCircle size={10} />}
                      {item.status === 'Rejected' && <X size={10} />}
                      {item.status}
                    </span>
                  </td>
                  
                  {/* Action Column (UPDATED LOGIC: Shows "Forwarded" status, added Approved/Rejected) */}
                  <td className="px-5 py-3 text-center">
                    {item.status === "Sent to HR" ? (
                      // Locked State - Shows Process Flow
                      <div className="flex justify-center items-center gap-1 opacity-60">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                           Manager
                         </span>
                         <ArrowRightCircle size={10} className="text-indigo-600" />
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                           HR Dept
                         </span>
                      </div>
                    ) : item.status === "Approved" ? (
                      // Approved State - Can Send to HR or View Bill
                      <div className="flex justify-center items-center gap-2 opacity-80">
                        <button onClick={() => handleSendToHR(item.id)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Send to HR">
                          <Building2 size={16} strokeWidth={2}/>
                        </button>
                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    ) : item.status === "Rejected" ? (
                      // Rejected State
                      <div className="flex justify-center items-center gap-2 opacity-80">
                        <X size={16} className="text-red-600" />
                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    ) : (
                      // Active Buttons for Pending Review and Clarification Req
                      <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleApprove(item.id)} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Approve">
                          <Check size={16} strokeWidth={3}/>
                        </button>
                        <button onClick={() => handleReject(item.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Reject">
                          <X size={16} strokeWidth={3}/>
                        </button>
                        <button onClick={() => { setPreviewUrl(item.file_link); setIsPreviewOpen(true); }} className="bg-gray-100 text-[#103c7f] p-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-all shadow-sm" title="View Bill Proof">
                          <FileText size={16} strokeWidth={2}/>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center text-[#103c7f] shrink-0">
           <div className="flex items-center gap-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">My Team: {teamCount} FSEs</p>
              <div className="h-3 w-px bg-gray-300"></div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Total Claims: {approvals.length}
              </p>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest">Total Approval Value: <span className="text-lg italic">₹{approvals.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, '') || 0), 0).toLocaleString()}</span></p>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Calibri'] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-4xl w-full p-8 relative overflow-hidden">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-5 mb-6">
              <div className="bg-[#103c7f]/5 w-16 h-16 rounded-2xl flex items-center justify-center text-[#103c7f] border border-[#103c7f]/10 shrink-0">
                <FileText size={30} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
                  Bill Preview
                </h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
                  Expense Proof Document
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <img src={previewUrl} alt="Bill Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}