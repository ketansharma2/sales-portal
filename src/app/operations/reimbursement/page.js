"use client";
import { useState, useEffect } from "react";
import { 
  CreditCard, History, CheckCircle, FileText, Search, X, Eye
} from "lucide-react";

// --- BILL PREVIEW MODAL COMPONENT ---
function BillPreviewModal({ fileUrl, fileName, onClose }) {
  if (!fileUrl) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#103c7f]"/>
            <h3 className="font-bold text-[#103c7f]">{fileName || 'Bill Preview'}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500"/>
          </button>
        </div>
        <div className="p-6 bg-gray-100 flex items-center justify-center min-h-[70vh]">
          <img 
            src={fileUrl} 
            alt={fileName || 'Bill Preview'}
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              // If image fails to load, show iframe fallback
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <iframe 
            src={fileUrl} 
            className="w-full max-w-3xl h-[65vh] border border-gray-300 rounded-lg bg-white shadow-lg hidden"
            title={fileName || 'Bill Preview'}
          />
        </div>
      </div>
    </div>
  );
}

export default function HRReimbursementPage() {
  // --- STATE MANAGEMENT ---
  const [mainTab, setMainTab] = useState("pending"); // 'pending' or 'history'
  const [queueFilter, setQueueFilter] = useState("all"); // 'all', 'fse', 'manager', 'hod'
  const [loading, setLoading] = useState(true);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  
  // --- BILL PREVIEW MODAL STATE ---
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState({ url: null, name: null });

  // --- FETCH DATA FROM API ---
  useEffect(() => {
    fetchPendingPayouts();
    fetchPaymentHistory();
  }, []);

  const fetchPendingPayouts = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/operations/pending-payouts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingClaims(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/operations/payment-history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  // --- LOGIC: FILTER PENDING LIST ---
  const filteredPending = pendingClaims.filter(item => {
    if (queueFilter === "all") return true;
    const itemRole = (item.role || '').toString().toLowerCase();
    const filterValue = queueFilter.toLowerCase();
    return itemRole === filterValue || itemRole.includes(filterValue);
  });

  // --- CALCULATE TOTAL PAYABLE ---
  const totalPayable = pendingClaims.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

  // --- ACTIONS ---
  const handlePayment = async (id) => {
    const claim = pendingClaims.find(c => c.id === id);
    if(confirm(`Confirm payment of ₹${claim.amount} to ${claim.empName}?`)) {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/operations/process-payment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ exp_id: id })
        });
        const data = await response.json();
        if (data.success) {
          // Refresh data after payment
          fetchPendingPayouts();
          fetchPaymentHistory();
        } else {
          alert('Failed to process payment: ' + data.error);
        }
      } catch (error) {
        console.error('Payment error:', error);
        alert('Error processing payment');
      }
    }
  };

  // --- BILL PREVIEW HANDLER ---
  const handlePreview = (fileUrl, fileName) => {
    if (fileUrl) {
      setSelectedFile({ url: fileUrl, name: fileName || 'Bill Receipt' });
      setShowPreview(true);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden flex-col">
      
      {/* ================= 1. TOP HEADER ================= */}
      <div className="bg-[#103c7f] h-16 px-6 border-b border-[#0d316a] shadow-md flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black text-white tracking-wide uppercase leading-none">
              Expense Management
            </h1>
            <p className="text-[10px] text-blue-200 font-medium opacity-80 mt-0.5">
              HR Finance Portal
            </p>
          </div>
        </div>
        
        {/* Total Pending KPI */}
        <div className="flex items-center gap-3 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-400/20">
           <div className="text-right">
               <p className="text-[9px] text-blue-200 uppercase font-bold">Total Payable</p>
               <p className="text-lg font-black text-white leading-none">
                 ₹ {totalPayable.toLocaleString()}
               </p>
           </div>
           <div className="bg-white/10 p-1.5 rounded text-white">
               <CreditCard size={18}/>
           </div>
        </div>
      </div>

      {/* ================= 2. MAIN TABS & FILTERS ================= */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex justify-between items-center shrink-0">
         
         {/* Main Tabs (Pending vs History) */}
         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
               onClick={() => setMainTab("pending")}
               className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mainTab === 'pending' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <CreditCard size={14}/> Pending Payouts
               <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full text-[9px]">{pendingClaims.length}</span>
            </button>
            <button 
               onClick={() => setMainTab("history")}
               className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mainTab === 'history' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <History size={14}/> Payment History
            </button>
         </div>

         {/* Sub-Filters (Only visible on Pending Tab) */}
         {mainTab === 'pending' && (
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Queue:</span>
                <button onClick={() => setQueueFilter('all')} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${queueFilter === 'all' ? 'bg-[#103c7f] text-white border-[#103c7f]' : 'bg-white text-gray-500 border-gray-200'}`}>All</button>
                <button onClick={() => setQueueFilter('fse')} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${queueFilter === 'fse' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200'}`}>FSE</button>
                <button onClick={() => setQueueFilter('manager')} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${queueFilter === 'manager' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-gray-500 border-gray-200'}`}>Managers</button>
                <button onClick={() => setQueueFilter('hod')} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${queueFilter === 'hod' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200'}`}>HODs</button>
             </div>
         )}

         {/* Search Bar */}
         {mainTab === 'history' && (
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search Transaction..." className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold w-64 outline-none focus:border-[#103c7f]"/>
            </div>
         )}
      </div>

      {/* ================= 3. CONTENT TABLE AREA ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
         
         {loading ? (
           <div className="flex items-center justify-center h-full">
             <p className="text-gray-500 font-bold">Loading...</p>
           </div>
         ) : (
           <>
           {/* VIEW 1: PENDING PAYOUTS TABLE */}
           {mainTab === 'pending' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-[#103c7f]/5 border-b border-[#103c7f]/10 text-[10px] font-black text-[#103c7f] uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Employee Details</th>
                          <th className="px-6 py-4">Expense Info</th>
                          <th className="px-6 py-4">Forwarded By</th>
                          <th className="px-6 py-4 text-left">Amount</th>
                          <th className="px-6 py-4 text-center">Receipt</th>
                          <th className="px-6 py-4 text-center w-48">HR Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                       {filteredPending.length > 0 ? filteredPending.map((claim) => (
                          <tr key={claim.id} className="hover:bg-blue-50/30 transition-colors group">
                              
                             {/* Employee */}
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                                      (claim.role?.toLowerCase?.() || '') === 'fse' ? 'bg-purple-100 text-purple-700' :
                                      (claim.role?.toLowerCase?.() || '') === 'manager' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                   }`}>
                                      {claim.empName?.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-gray-800 text-sm">{claim.empName}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 text-sky-600">
                                          {claim.role}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-600">
                                          {claim.sector}
                                        </span>
                                      </div>
                                   </div>
                                </div>
                             </td>

                             {/* Expense Info: With Remarks */}
                             <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-700">{claim.category}</span>
                                      <span className="text-[10px] text-gray-400">• {claim.date}</span>
                                   </div>
                                   <p className="text-[11px] text-gray-500 italic truncate max-w-[180px]">
                                      "{claim.desc}"
                                   </p>
                                </div>
                             </td>

                             {/* Forwarded By (Chain of command) */}
                             <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="font-bold text-gray-800 flex items-center gap-1">
                                      <CheckCircle size={10} className="text-green-500"/> {claim.approver}
                                   </span>
                                   <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-green-100">
                                      Ready for Payment
                                   </span>
                                </div>
                             </td>

                             {/* Amount */}
                             <td className="px-6 py-4 text-left font-black text-gray-800 text-sm">
                                ₹ {claim.amount}
                             </td>

                             {/* Receipt */}
                             <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center">
                                  {claim.file_link && (
                                    <button 
                                      onClick={() => handlePreview(claim.file_link, `${claim.empName}_${claim.category}_Receipt`)}
                                      className="text-gray-400 hover:text-[#103c7f] transition-colors tooltip p-1.5 hover:bg-gray-100 rounded-md"
                                      title="View Receipt"
                                    >
                                       <Eye size={16}/>
                                    </button>
                                  )}
                                </div>
                             </td>

                             {/* Actions */}
                             <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                   
                                   <button 
                                      onClick={() => handlePayment(claim.id)}
                                      className="px-3 py-2 rounded-lg bg-[#103c7f] text-white hover:bg-blue-900 shadow-md transition-all flex items-center gap-1.5 text-[10px] font-bold"
                                   >
                                      <CreditCard size={12}/> Payment Done
                                   </button>
                                </div>
                             </td>
                          </tr>
                       )) : (
                          <tr>
                             <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                   <CheckCircle size={32} className="opacity-20"/>
                                   <p className="text-sm font-bold">No pending payouts in this queue.</p>
                                </div>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           )}

           {/* VIEW 2: HISTORY TABLE */}
           {mainTab === 'history' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-[#103c7f]/5 border-b border-[#103c7f]/10 text-[10px] font-black text-[#103c7f] uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4 text-left">Employee Details</th>
                          <th className="px-6 py-4 text-left">Expense Info</th>
                          <th className="px-6 py-4 text-left">Claim Amount & Proof</th>
                          <th className="px-6 py-4 text-left">Forwarded By</th>
                          <th className="px-6 py-4 text-left">Payout Details</th>
                          <th className="px-6 py-4 text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                       {historyData.length > 0 ? historyData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              
                             {/* 1. Employee Details */}
                             <td className="px-6 py-4 text-left">
                                <p className="font-bold text-[#103c7f] text-sm">{item.empName}</p>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase">{item.role}</p>
                             </td>

                             {/* 2. Expense Info */}
                             <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start"> 
                                   <div className="flex items-center gap-2">
                                      <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                                         {item.category}
                                      </span>
                                      <span className="text-[10px] text-gray-400">{item.expenseDate}</span>
                                   </div>
                                   <p className="text-[11px] text-gray-600 italic truncate max-w-[180px]" title={item.desc}>
                                      "{item.desc}"
                                   </p>
                                </div>
                             </td>

                             {/* 3. Claim Amount & Proof */}
                             <td className="px-6 py-4">
                                <div className="flex items-center justify-start gap-2">
                                   <span className="font-bold text-gray-800 text-sm w-20">₹ {item.amount}</span>
                                   {item.file_link && (
                                     <button 
                                       onClick={() => handlePreview(item.file_link, `${item.empName}_${item.category}_Receipt`)}
                                       className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md border border-transparent hover:border-blue-100 transition-all"
                                       title="View Receipt"
                                     >
                                        <Eye size={14}/>
                                     </button>
                                   )}
                                </div>
                             </td>

                             {/* 4. Forwarded By / Approved By */}
                             <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="font-bold text-gray-700">{item.approvedBy}</span>
                                   <span className="text-[9px] text-gray-400">{item.approvedAt}</span>
                                </div>
                             </td>

                             {/* 5. Payout Details */}
                             <td className="px-6 py-4">
                                <div className="flex flex-col items-start">
                                   <span className="font-black text-green-600 text-sm">
                                      ₹ {item.amount}
                                   </span>
                                   <span className="text-[10px] text-gray-400 font-mono">
                                      Paid: {item.paidDate}
                                   </span>
                                </div>
                             </td>

                             {/* 6. Status */}
                             <td className="px-6 py-4 text-center">
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 w-fit mx-auto bg-green-50 text-green-700 border-green-200">
                                   <CheckCircle size={10} />
                                   Done
                                </span>
                             </td>

                          </tr>
                       )) : (
                          <tr>
                             <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                   <CheckCircle size={32} className="opacity-20"/>
                                   <p className="text-sm font-bold">No payment history available.</p>
                                </div>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           )}
           </>
         )}
      </div>

      {/* ================= 4. BILL PREVIEW MODAL ================= */}
      {showPreview && (
        <BillPreviewModal 
          fileUrl={selectedFile.url} 
          fileName={selectedFile.name} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}
