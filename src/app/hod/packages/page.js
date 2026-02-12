"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  Download, Edit, CheckCircle2, XCircle, Save, X, Plus, Star, Clock
} from "lucide-react";

export default function SalesPackagesPage() {
  
  // --- DEFAULT DATA (Maven Theme Applied) ---
  // Using clean outlines and distinct top borders for a modern SaaS look
  const [packages, setPackages] = useState([
    { 
        id: 'p1', label: "Basic",  price: "4999", isPopular: false,
        // Silver/Gray Theme
        theme: { 
            borderColor: 'border-slate-300', 
            topBorder: 'border-t-slate-500',
            bg: 'bg-white',
            labelColor: 'text-slate-600',
            priceColor: 'text-slate-800',
            btnColor: 'border-slate-300 text-slate-600 hover:bg-slate-50',
            checkColor: 'text-slate-500'
        }
    },
    { 
        id: 'p2', label: "Standard",  price: "7999", isPopular: false,
        // Blue Theme
        theme: { 
            borderColor: 'border-blue-200', 
            topBorder: 'border-t-blue-500',
            bg: 'bg-blue-50/30',
            labelColor: 'text-blue-600',
            priceColor: 'text-blue-900',
            btnColor: 'border-blue-200 text-blue-600 hover:bg-blue-50',
            checkColor: 'text-blue-500'
        }
    },
    { 
        id: 'p3', label: "Premium",  price: "17999", isPopular: true, 
        // Maven Green Theme (Popular)
        theme: { 
            borderColor: 'border-[#a1db40]', 
            topBorder: 'border-t-[#a1db40]',
            bg: 'bg-[#f4fce3]/50', // Very light green tint
            labelColor: 'text-[#3f6212]',
            priceColor: 'text-[#103c7f]',
            btnColor: 'bg-[#103c7f] text-white hover:bg-blue-900 border-transparent',
            checkColor: 'text-[#a1db40]' // Maven Green Checks
        }
    },
    { 
        id: 'p4', label: "Pro", price: "8.33%", isPopular: false,
        // Purple/Pro Theme
        theme: { 
            borderColor: 'border-purple-200', 
            topBorder: 'border-t-purple-500',
            bg: 'bg-purple-50/30',
            labelColor: 'text-purple-600',
            priceColor: 'text-purple-900',
            btnColor: 'border-purple-200 text-purple-600 hover:bg-purple-50',
            checkColor: 'text-purple-500'
        }
    },
  ]);

  const [features, setFeatures] = useState([
    { id: 1, name: "Blue Collar Recruitment", p1: false, p2: false, p3: false, p4: false },
    { id: 2, name: "White Collar Recruitment", p1: true, p2: true, p3: true, p4: true },
    { id: 3, name: "Executive Communicator", p1: true, p2: false, p3: false, p4: false },
    { id: 4, name: "Senior Communicator", p1: false, p2: true, p3: true, p4: true },
    { id: 5, name: "Generic Hiring", p1: true, p2: true, p3: false, p4: false },
    { id: 6, name: "Mid Level Hiring", p1: false, p2: true, p3: true, p4: true },
    { id: 7, name: "Senior Level Hiring", p1: false, p2: false, p3: true, p4: true },
    { id: 8, name: "CEO / Industry focus hiring", p1: false, p2: false, p3: false, p4: true },
    { id: 9, name: "JD Preparation", p1: true, p2: true, p3: true, p4: true },
    { id: 10, name: "JD Optimization", p1: false, p2: true, p3: true, p4: true },
    { id: 11, name: "Job Posting", p1: true, p2: true, p3: true, p4: true },
    { id: 12, name: "Virtual Screening 1st round", p1: true, p2: true, p3: true, p4: true },
    { id: 13, name: "Virtual Screening 2nd round", p1: false, p2: true, p3: true, p4: true },
    { id: 14, name: "Customized Screening", p1: false, p2: false, p3: true, p4: true },
    { id: 15, name: "Document Verification", p1: false, p2: true, p3: true, p4: true },
    { id: 16, name: "Background Verification", p1: false, p2: false, p3: true, p4: true },
    { id: 17, name: "Replacement Time", p1: "30 days", p2: "14 days", p3: "14 days", p4: "14 days" },
  ]);

  // --- STATES ---
  const [editingPkg, setEditingPkg] = useState(null); 
  const [tempPkgFeatures, setTempPkgFeatures] = useState([]); 
  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState("");

  // --- HANDLERS ---
  const openEditModal = (pkg) => {
      setEditingPkg({ ...pkg });
      // Create a temporary copy of features specifically for this package to edit
      const pkgSpecificFeatures = features.map(f => ({
          id: f.id, name: f.name, value: f[pkg.id] 
      }));
      setTempPkgFeatures(pkgSpecificFeatures);
  };

  const handleTempFeatureChange = (id, newValue) => {
      setTempPkgFeatures(prev => prev.map(f => f.id === id ? { ...f, value: newValue } : f));
  };

  const savePackageEdit = () => {
      // 1. Update Package Details (Price, Label)
      setPackages(prev => prev.map(p => p.id === editingPkg.id ? editingPkg : p));
      
      // 2. Update Features (Map back the temp changes to global state)
      setFeatures(prev => prev.map(globalFeat => {
          const editedFeat = tempPkgFeatures.find(tf => tf.id === globalFeat.id);
          return { ...globalFeat, [editingPkg.id]: editedFeat.value };
      }));
      
      setEditingPkg(null);
  };

  const handleAddFeature = () => {
      if(!newFeatureName.trim()) return;
      const newId = features.length > 0 ? Math.max(...features.map(f => f.id)) + 1 : 1;
      // Add new feature with default false for all packages
      setFeatures([...features, { id: newId, name: newFeatureName, p1: false, p2: false, p3: false, p4: false }]);
      setNewFeatureName("");
      setIsAddFeatureOpen(false);
  };

  const downloadPDF = () => {
      window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-8 w-full">
      
      {/* --- HEADER (Hidden in Print) --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 print:hidden gap-4">
         <div className="text-center md:text-left">
             <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight">Pricing & Packages</h1>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Maven Jobs Service Plans</p>
         </div>
         <div className="flex gap-3">
             <button onClick={() => setIsAddFeatureOpen(true)} className="bg-white border border-gray-200 text-[#103c7f] px-4 py-2 rounded-xl font-bold text-xs shadow-sm hover:bg-gray-50 transition flex items-center gap-2">
                <Plus size={16}/> Add Feature
             </button>
             <button onClick={downloadPDF} className="bg-[#103c7f] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center gap-2 uppercase tracking-wide">
                <Download size={16}/> Print PDF
             </button>
         </div>
      </div>

      {/* --- PRINTABLE SECTION --- */}
      <div id="print-area" className="w-full">
          
          {/* Print Only Header */}
          <div className="hidden print:flex justify-between items-end mb-6 border-b-2 border-[#103c7f] pb-4">
              <Image src="/maven-logo.png" alt="Maven Jobs" width={200} height={70} className="object-contain" priority />
              <div className="text-right">
                  <h1 className="text-2xl font-black text-[#103c7f] uppercase">Service Packages</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Comparison Overview</p>
              </div>
          </div>

          {/* --- CARDS CONTAINER (Fixed Full Width) --- */}
          {/* Using grid-cols-4 with strict width to prevent wrapping */}
          <div className="grid grid-cols-4 gap-4 w-full items-stretch">
              
              {packages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className={`
                        flex flex-col rounded-2xl relative transition-all duration-300 w-full min-w-0 
                        border ${pkg.theme.borderColor} border-t-[6px] ${pkg.theme.topBorder} ${pkg.theme.bg}
                        ${pkg.isPopular ? 'shadow-2xl scale-[1.02] z-10 print:scale-100 print:shadow-none' : 'shadow-sm hover:shadow-md print:shadow-none bg-white'}
                    `}
                  >
                     
                      {/* Header */}
                      <div className={`p-6 text-center border-b border-gray-100/50`}>
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{pkg.name}</h3>
                          <h2 className={`text-2xl font-black uppercase tracking-tight ${pkg.theme.labelColor}`}>
                              {pkg.label}
                          </h2>
                          <div className="mt-3">
                              {pkg.price.includes('%') ? (
                                  <span className={`text-3xl font-black ${pkg.theme.priceColor}`}>{pkg.price}</span>
                              ) : (
                                  <>
                                      <span className="text-sm font-bold text-gray-400 align-top mr-1">₹</span>
                                      <span className={`text-4xl font-black ${pkg.theme.priceColor}`}>{pkg.price}</span>
                                  </>
                              )}
                          </div>
                      </div>

                      {/* Features List */}
                      <div className="p-5 flex-1">
                          <ul className="space-y-3">
                              {features.map((feat) => {
                                  const value = feat[pkg.id];
                                  const isTextValue = typeof value === 'string' && value.length > 0;
                                  const isIncluded = value === true || isTextValue;
                                  
                                  return (
                                      <li key={feat.id} className="flex items-start gap-2.5 min-h-[24px]">
                                          {/* Icon / Indicator */}
                                          <div className="mt-0.5 shrink-0 w-5 flex justify-center">
                                              {isTextValue ? (
                                                  <Clock size={16} className={pkg.theme.checkColor} />
                                              ) : value === true ? (
                                                  <CheckCircle2 size={18} className={pkg.theme.checkColor} strokeWidth={2.5} />
                                              ) : (
                                                  <XCircle size={18} className="text-gray-300/50" />
                                              )}
                                          </div>
                                          
                                          {/* Text Content */}
                                          <div className="flex flex-col w-full min-w-0">
                                              <span className={`text-[11px] font-bold leading-tight truncate ${isIncluded ? 'text-gray-700' : 'text-gray-400/70'}`}>
                                                  {feat.name}
                                              </span>
                                              
                                              {/* Explicitly Render Text Values */}
                                              {isTextValue && (
                                                  <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${pkg.theme.labelColor}`}>
                                                      {value}
                                                  </span>
                                              )}
                                          </div>
                                      </li>
                                  );
                              })}
                          </ul>
                      </div>

                      {/* Individual Edit Button (Hidden in Print) */}
                      <div className="p-5 pt-0 mt-auto print:hidden">
                          <button 
                              onClick={() => openEditModal(pkg)}
                              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all border-2 flex items-center justify-center gap-2 ${pkg.theme.btnColor}`}
                          >
                              <Edit size={14} /> Edit {pkg.label}
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidential & Proprietary - Maven Jobs India</p>
          </div>
      </div>


      {/* =========================================
          MODALS (Edit & Add) - Print Hidden
          ========================================= */}

      {/* Edit Package Modal */}
      {editingPkg && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white">
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg uppercase tracking-wide">Edit {editingPkg.label}</h3>
                    <button onClick={() => setEditingPkg(null)} className="hover:bg-white/20 p-1.5 rounded-full"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50">
                    {/* Basic Info */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-5 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Name</label>
                            <input type="text" value={editingPkg.label} onChange={(e) => setEditingPkg({...editingPkg, label: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f]"/>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Price</label>
                            <input type="text" value={editingPkg.price} onChange={(e) => setEditingPkg({...editingPkg, price: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f]"/>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {tempPkgFeatures.map((feat) => (
                            <div key={feat.id} className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50">
                                <span className="text-xs font-bold text-gray-700 w-1/2">{feat.name}</span>
                                <div className="flex items-center gap-2 w-1/2 justify-end">
                                    {typeof feat.value === 'boolean' ? (
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button 
                                                onClick={() => handleTempFeatureChange(feat.id, true)} 
                                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${feat.value ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                Yes
                                            </button>
                                            <button 
                                                onClick={() => handleTempFeatureChange(feat.id, false)} 
                                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${!feat.value ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                No
                                            </button>
                                            <button 
                                                onClick={() => handleTempFeatureChange(feat.id, "Type Value")} 
                                                className="px-2 text-[10px] font-bold text-blue-500 underline ml-1 hover:text-blue-700"
                                            >
                                                Text
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={feat.value} 
                                                onChange={(e) => handleTempFeatureChange(feat.id, e.target.value)} 
                                                className="border border-blue-300 bg-blue-50 rounded-lg p-1.5 text-xs font-bold text-[#103c7f] w-32 outline-none"
                                                placeholder="e.g. 30 Days"
                                            />
                                            <button 
                                                onClick={() => handleTempFeatureChange(feat.id, false)} 
                                                className="p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-500 transition"
                                                title="Reset to No"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={() => setEditingPkg(null)} className="px-5 py-2 rounded-xl font-bold text-gray-500 text-sm hover:bg-gray-100">Cancel</button>
                    <button onClick={savePackageEdit} className="bg-[#103c7f] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center gap-2">
                        <Save size={18}/> Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Feature Modal */}
      {isAddFeatureOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                  <div className="p-5">
                      <h3 className="text-base font-black text-[#103c7f] uppercase mb-2">Add New Service</h3>
                      <input type="text" value={newFeatureName} onChange={(e) => setNewFeatureName(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-[#103c7f]" placeholder="Service Name"/>
                  </div>
                  <div className="p-3 bg-gray-50 border-t flex justify-end gap-2">
                      <button onClick={() => setIsAddFeatureOpen(false)} className="px-4 py-2 font-bold text-gray-500 text-xs">Cancel</button>
                      <button onClick={handleAddFeature} className="bg-[#a1db40] text-[#103c7f] px-5 py-2 rounded-lg font-black text-xs uppercase">Add</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- PRINT CSS --- */}
      <style jsx global>{`
        @media print {
            @page { size: landscape; margin: 5mm; }
            body { background: white; margin: 0; padding: 0; }
            
            /* Hide non-printable elements */
            .print\\:hidden, header, aside, nav, .sidebar { display: none !important; }
            
            /* Show printable section */
            .print\\:flex { display: flex !important; }
            .print\\:block { display: block !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:scale-100 { transform: scale(1) !important; }
            
            /* Layout Adjustments */
            #print-area { width: 100% !important; max-width: 100% !important; }
            .grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
            
            /* Color Fidelity */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            /* Ensure text is readable */
            .text-gray-300 { color: #e5e7eb !important; } 
        }
      `}</style>

    </div>
  );
}