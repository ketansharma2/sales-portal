"use client";

import React, { useState, useRef } from "react";
import { 
  Plus, Trash2, Printer, X, FileText, 
  Building2, Receipt, FileCheck, Users
} from "lucide-react";

// --- PERMANENT HARDCODED DATA ---
const COMPANY_DATA = {
  name: "SAVVI SALES & SERVICES PVT LTD",
  address: "331, GANDHI COLONY, SAMALKHA PANIPAT (HR)",
  email: "savvisales@gmail.com",
  gstin: "06AAZCS0495D1ZY",
  bank: {
    name: "STATE BANK OF INDIA",
    account: "37085013734",
    ifsc: "SBIN0050099",
    branch: "SAMALKHA (CODE: 1073)" 
  },
  terms: [
    "All disputes subject to Samalkha jurisdiction.",
    "Our responsibility ceases as soon as goods/services leave our premises.",
    "Payments by Account Payee Cheque/NEFT/RTGS only."
  ]
};

const STATES = ["Haryana", "Delhi", "Punjab", "UP", "Rajasthan", "Maharashtra", "Karnataka"];

// Helper for date formatting
Date.prototype.format = function(format) {
    const d = this;
    const map = {
        'DD': d.getDate().toString().padStart(2, '0'),
        'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
        'YY': d.getFullYear().toString().substring(2)
    };
    return format.replace(/DD|MM|YY/gi, matched => map[matched]);
};

export default function ProformaInvoicePage() {
  const [piData, setPiData] = useState(null);
  const previewRef = useRef(null);

  // --- FORM STATE ---
  const [form, setForm] = useState({
    invoiceNo: `SAVVI/PI/${new Date().format('DDMMYY')}/${Math.floor(Math.random() * 100)}`,
    date: new Date().toISOString().split('T')[0],
    fromDate: "", 
    toDate: "",   
    customer: { name: "Shree radhe", address: "At. Dolatpura, Taluka Desar, District Vadodara – 391774, Haryana, India", gstin: "PHBF184492", state: "Haryana", pincode: "132103" }, 
    // NEW: Candidates Array for the new table
    candidates: [{ id: 1, role: "Sales Executive", name: "Rahul Kumar", ctc: 500000, billingPercent: 8.33 }]
  });

  // --- AMOUNT IN WORDS CONVERTER ---
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupee Only' : 'Rupee Only';
    return str;
  };

  // --- CALCULATIONS ---
  // Taxable value is now the sum of all candidate fees
  const taxableValue = form.candidates.reduce((sum, c) => sum + ((c.ctc * c.billingPercent) / 100), 0);
  const isInterstate = form.customer.state !== "Haryana";
  const cgst = isInterstate ? 0 : taxableValue * 0.09;
  const sgst = isInterstate ? 0 : taxableValue * 0.09;
  const igst = isInterstate ? taxableValue * 0.18 : 0;
  const grandTotal = Math.round(taxableValue + cgst + sgst + igst);

  // --- CANDIDATE HANDLERS ---
  const addCandidate = () => {
    setForm({ ...form, candidates: [...form.candidates, { id: Date.now(), role: "", name: "", ctc: 0, billingPercent: 8.33 }] });
  };

  const removeCandidate = (id) => {
    setForm({ ...form, candidates: form.candidates.filter(c => c.id !== id) });
  };

  const handleCandidateChange = (id, field, value) => {
    const updatedCandidates = form.candidates.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setForm({ ...form, candidates: updatedCandidates });
  };

  const generatePI = () => {
    setPiData({ 
      ...form, 
      taxableValue, cgst, sgst, igst, grandTotal,
      amountInWords: numberToWords(grandTotal) 
    });
    
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePrintPI = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-['Calibri'] print:p-0 print:bg-white">
      
      {/* =========================================
          FORM SECTION (Hidden during print)
      ========================================= */}
      <div className="max-w-6xl mx-auto print:hidden">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <img src="/maven-logo.png" alt="Maven Logo" className="h-10 w-auto object-contain" />
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">PI Generation System</h1>
          </div>
          <button 
            onClick={generatePI}
            className="bg-[#103c7f] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-blue-800 transition flex items-center gap-2"
          >
            <Plus size={18} /> Generate PI Preview
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={14}/> Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Customer Name" className="col-span-2 p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:border-[#103c7f]" value={form.customer.name} onChange={e => setForm({...form, customer: {...form.customer, name: e.target.value}})} />
                <textarea placeholder="Address" className="col-span-2 p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:border-[#103c7f] h-20" value={form.customer.address} onChange={e => setForm({...form, customer: {...form.customer, address: e.target.value}})} />
                
                <input type="text" placeholder="GSTIN" className="p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:border-[#103c7f]" value={form.customer.gstin} onChange={e => setForm({...form, customer: {...form.customer, gstin: e.target.value}})} />
                <input type="text" placeholder="Pincode" className="p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:border-[#103c7f]" value={form.customer.pincode} onChange={e => setForm({...form, customer: {...form.customer, pincode: e.target.value}})} />
                
                <select className="p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:border-[#103c7f]" value={form.customer.state} onChange={e => setForm({...form, customer: {...form.customer, state: e.target.value}})}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="date" title="From Date" className="w-1/2 p-2.5 border rounded-lg text-xs bg-gray-50 outline-none focus:border-[#103c7f]" value={form.fromDate} onChange={e => setForm({...form, fromDate: e.target.value})} />
                  <input type="date" title="To Date" className="w-1/2 p-2.5 border rounded-lg text-xs bg-gray-50 outline-none focus:border-[#103c7f]" value={form.toDate} onChange={e => setForm({...form, toDate: e.target.value})} />
                </div>
              </div>
            </section>

            {/* NEW: CANDIDATE INPUT SECTION */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Candidate Details</h3>
                <button onClick={addCandidate} className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:underline"><Plus size={14}/> Add Candidate</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest border-b pb-2">
                    <th className="pb-2 w-[25%]">Job Role</th>
                    <th className="pb-2 w-[25%]">Candidate Name</th>
                    <th className="pb-2 w-[20%] text-right">CTC (Annual)</th>
                    <th className="pb-2 w-[15%] text-right">Billing %</th>
                    <th className="pb-2 w-[10%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {form.candidates.map((c) => (
                    <tr key={c.id}>
                      <td className="py-4"><input type="text" value={c.role} className="w-full bg-transparent outline-none text-gray-800" onChange={e => handleCandidateChange(c.id, 'role', e.target.value)} placeholder="Role"/></td>
                      <td><input type="text" value={c.name} className="w-full bg-transparent outline-none font-bold text-[#103c7f]" onChange={e => handleCandidateChange(c.id, 'name', e.target.value)} placeholder="Name"/></td>
                      <td><input type="number" value={c.ctc} className="w-full bg-transparent text-right font-bold outline-none" onChange={e => handleCandidateChange(c.id, 'ctc', Number(e.target.value))} /></td>
                      <td><input type="number" step="0.01" value={c.billingPercent} className="w-full bg-transparent text-right text-gray-600 outline-none" onChange={e => handleCandidateChange(c.id, 'billingPercent', Number(e.target.value))} /></td>
                      <td className="text-right"><button onClick={() => removeCandidate(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-[#103c7f] p-6 rounded-2xl shadow-xl text-white">
              <h3 className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Financial Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between opacity-80"><span>Total Candidates</span><span>{form.candidates.length}</span></div>
                <div className="flex justify-between opacity-80"><span>Taxable Value</span><span>₹{taxableValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span></div>
                <div className="flex justify-between opacity-80">
                  <span>{isInterstate ? 'IGST (18%)' : 'CGST/SGST (18%)'}</span>
                  <span>₹{(cgst + sgst + igst).toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                </div>
                <div className="pt-4 border-t border-white/20 flex justify-between text-2xl font-black">
                  <span>Total</span><span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] italic opacity-60 mt-2 leading-tight">{numberToWords(grandTotal)}</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================
          INLINE PREVIEW SECTION (Visible during print)
      ========================================= */}
      {piData && (
        <div ref={previewRef} className="max-w-[210mm] mx-auto mt-12 bg-white shadow-2xl print:shadow-none print:m-0 print:w-full print:max-w-full">
            
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden rounded-t-lg">
              <span className="text-xs font-black uppercase text-gray-400 flex items-center gap-2"><FileCheck size={16} className="text-emerald-500"/> Proforma Invoice Preview</span>
              <div className="flex gap-2">
                <button onClick={handlePrintPI} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition">
                  <Printer size={14}/> Print / Save PDF
                </button>
                <button onClick={() => setPiData(null)} className="bg-white border p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><X size={16}/></button>
              </div>
            </div>

            <div className="p-4 text-black flex flex-col"> 
              
              {/* --- Header --- */}
              <div className="flex justify-between items-center border-b-4 border-[#103c7f] pb-6 mb-8">
                <div className="flex items-center gap-2">
                  <img src="/Savvi-Logo.png" alt="Savvi Logo" className="h-30 w-auto object-contain" />
                  <div className="text-[11px] font-bold leading-tight text-gray-600 uppercase border-l-2 border-gray-200 pl-5 py-2">
                    <p className="text-black text-sm mb-1">{COMPANY_DATA.name}</p>
                    <p>{COMPANY_DATA.address}</p>
                    <p>EMAIL: {COMPANY_DATA.email}</p>
                    <p className="text-black mt-1">GSTIN: {COMPANY_DATA.gstin}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end text-right"> 
                  <div className="flex flex-col items-end mb-2">
                    <img src="/maven-logo.png" alt="Maven Logo" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="text-xs space-y-1">
                    <h1 className="text-3xl font-black uppercase mb-1 text-[#103c7f] tracking-tight">Proforma Invoice</h1>
                    <p><b>PI NO:</b> {piData.invoiceNo}</p>
                    <p><b>DATE:</b> {piData.date}</p>
                    {piData.fromDate && <p><b>FROM:</b> {piData.fromDate} <b>TO:</b> {piData.toDate}</p>}
                  </div>
                </div>
              </div>

              {/* --- Billed To & Bank Details --- */}
              <div className="grid grid-cols-2 gap-12 mb-2 pb-8 border-b border-gray-100">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Billed To (Buyer)</h4>
                    <div className="text-xs leading-relaxed text-gray-800 space-y-1.5">
                      <p className="flex items-start">
                        <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Name:</span>
                        <span className="flex-1 font-black uppercase">{piData.customer.name}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Address:</span>
                        <span className="flex-1 font-medium whitespace-pre-line">{piData.customer.address}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">State:</span>
                        <span className="flex-1 font-bold">{piData.customer.state}</span>
                      </p>
                      {piData.customer.pincode && (
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Pincode:</span>
                          <span className="flex-1 font-bold">{piData.customer.pincode}</span>
                        </p>
                      )}
                      {piData.customer.gstin && (
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">GSTIN:</span>
                          <span className="flex-1 font-bold">{piData.customer.gstin}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                  <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Payment / Bank Details</h4>
                  <div className="text-[10px] leading-relaxed font-bold text-gray-700 space-y-1">
                    <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">BANK:</span> {COMPANY_DATA.bank.name}</p>
                    <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">A/C NO:</span> {COMPANY_DATA.bank.account}</p>
                    <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">IFSC:</span> {COMPANY_DATA.bank.ifsc}</p>
                    <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">BRANCH:</span> {COMPANY_DATA.bank.branch}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                
                {/* --- NEW: CANDIDATE DETAILS TABLE --- */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2">Candidate Details</h4>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="p-2 border border-gray-300 text-center text-[9px] font-bold uppercase tracking-wider w-10">Sr No</th>
                        <th className="p-2 border border-gray-300 text-left text-[9px] font-bold uppercase tracking-wider">Job Role</th>
                        <th className="p-2 border border-gray-300 text-left text-[9px] font-bold uppercase tracking-wider">Candidate Name</th>
                        <th className="p-2 border border-gray-300 text-right text-[9px] font-bold uppercase tracking-wider">CTC (Annual)</th>
                        <th className="p-2 border border-gray-300 text-center text-[9px] font-bold uppercase tracking-wider w-16">Billing %</th>
                        <th className="p-2 border border-gray-300 text-right text-[9px] font-bold uppercase tracking-wider">Fee Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {piData.candidates.map((c, idx) => {
                        const feeAmt = (c.ctc * c.billingPercent) / 100;
                        return (
                          <tr key={c.id} className="border-b border-gray-300">
                            <td className="p-2 border-r border-gray-300 text-center text-gray-500">{idx + 1}</td>
                            <td className="p-2 border-r border-gray-300 text-gray-700">{c.role}</td>
                            <td className="p-2 border-r border-gray-300 font-bold uppercase text-[#103c7f]">{c.name}</td>
                            <td className="p-2 border-r border-gray-300 text-right text-gray-700">₹{c.ctc.toLocaleString('en-IN')}</td>
                            <td className="p-2 border-r border-gray-300 text-center text-gray-700">{c.billingPercent}%</td>
                            <td className="p-2 text-right font-bold text-gray-900">₹{feeAmt.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* --- EXISTING SERVICE TABLE (Single Row) --- */}
                <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2">Service Details</h4>
                <table className="w-full mb-4 border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-[#103c7f] text-white">
                      <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider w-12">S.No</th>
                      <th className="p-3 border border-[#103c7f] text-left text-[10px] font-black uppercase tracking-wider">Description of Goods/Services</th>
                      <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">HSN/SAC</th>
                      <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">Quantity</th>
                      <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">Unit</th>
                      <th className="p-3 border border-[#103c7f] text-right text-[10px] font-black uppercase tracking-wider">Unit Rate</th>
                      <th className="p-3 border border-[#103c7f] text-right text-[10px] font-black uppercase tracking-wider">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-b border-gray-300 h-10">
                      <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-700">1</td>
                      <td className="p-3 border-r border-gray-300 font-bold uppercase">Permanent Staffing Services</td>
                      <td className="p-3 border-r border-gray-300 text-center text-gray-600">998512</td>
                      <td className="p-3 border-r border-gray-300 text-center font-medium">1</td>
                      <td className="p-3 border-r border-gray-300 text-center font-medium">No.</td>
                      <td className="p-3 border-r border-gray-300 text-right text-gray-600 font-medium">
                        ₹{piData.taxableValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </td>
                      <td className="p-3 text-right font-black text-gray-800">
                        ₹{piData.taxableValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* --- TOTALS --- */}
                <div className="flex flex-row justify-between items-end pt-6 mt-auto">
                  <div className="border-l-4 border-[#103c7f] pl-3 py-1 mb-1 max-w-[55%]">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount in Words</p>
                    <p className="text-xs font-bold italic text-gray-800 leading-relaxed">{piData.amountInWords}</p>
                  </div>

                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-gray-600 px-2">
                      <span>Taxable Value:</span>
                      <span>₹ {piData.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between font-bold text-gray-600 px-2">
                      <span>CGST (9%):</span>
                      <span>₹ {piData.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-600 px-2">
                      <span>SGST (9%):</span>
                      <span>₹ {piData.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-600 px-2">
                      <span>IGST (18%):</span>
                      <span>₹ {piData.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between font-bold text-gray-600 px-2">
                      <span>Round Off:</span>
                      <span>
                        {(piData.grandTotal - (piData.taxableValue + piData.cgst + piData.sgst + piData.igst)).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-black border-t-2 border-black pt-2 mt-2 px-2 text-[#103c7f]">
                      <span>Grand Total:</span>
                      <span>₹ {Math.round(piData.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-start">
                <div className="text-[10px] space-y-1 max-w-[60%]">
                  <p className="font-black text-[#103c7f] uppercase mb-3">Terms & Conditions:</p>
                  {COMPANY_DATA.terms.map((t, i) => (
                    <p key={i} className="text-gray-600 font-medium mb-1">{i+1}. {t}</p>
                  ))}
                </div>

                <div className="text-center flex flex-col justify-between min-h-[100px]">
                  <p className="text-[11px] font-black uppercase text-gray-800">For {COMPANY_DATA.name}</p>
                  <div className="mt-auto">
                    <div className="border-t-2 border-gray-800 w-48 mx-auto"></div>
                    <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 italic mt-1.5">Authorised Signatory</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                   Powered by <span className="text-[#103c7f]">SAVVI SALES & SERVICES PVT LTD</span>
                 </p>
              </div>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body, div#__next, main {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          @page { size: A4 portrait; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:w-full { width: 100% !important; }
          .print\\:max-w-full { max-width: 100% !important; }
        }
      `}} />
    </div>
  );
}