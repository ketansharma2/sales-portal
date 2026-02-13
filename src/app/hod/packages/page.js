"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  Download, CheckCircle2, XCircle, Clock
} from "lucide-react";

export default function SalesPackagesPage() {
    
  // --- DEFAULT DATA (Maven Theme Applied) ---
  const [packages] = useState([
    { 
        id: 'p1', label: "Basic",  price: "4999", isPopular: false,
        theme: { 
            borderColor: 'rgb(115, 133, 160)', 
            topBorder: '#64748b',
            bg: '#ffffff',
            labelColor: '#475569',
            priceColor: '#000000',
            checkColor: '#84cc16'
        }
    },
    { 
        id: 'p2', label: "Standard",  price: "7999", isPopular: false,
        theme: { 
            borderColor: 'rgb(25, 118, 210)', 
            topBorder: '#3b82f6',
            bg: '#ffffff',
            labelColor: '#2563eb',
            priceColor: '#000000',
            checkColor: '#84cc16'
        }
    },
    { 
        id: 'p3', label: "Premium",  price: "17999", isPopular: true, 
        theme: { 
            borderColor: 'rgb(132, 204, 22)', 
            topBorder: '#84cc16',
            bg: '#ffffff',
            labelColor: '#365314',
            priceColor: '#000000',
            checkColor: '#84cc16'
        }
    },
    { 
        id: 'p4', label: "Pro", price: "8.33%", isPopular: false,
        theme: { 
            borderColor: 'rgb(168, 85, 247)', 
            topBorder: '#a855f7',
            bg: '#ffffff',
            labelColor: '#7e22ce',
            priceColor: '#000000',
            checkColor: '#84cc16'
        }
    },
  ]);

  const [features] = useState([
    { id: 1, name: "Blue Collar Recruitment", p1: false, p2: false, p3: false, p4: false },
    { id: 2, name: "White Collar Recruitment", p1: true, p2: true, p3: true, p4: true },
    { id: 3, name: "Executive Communicator", p1: true, p2: false, p3: false, p4: false },
    { id: 4, name: "Senior Communicator", p1: false, p2: true, p3: true, p4: true },
    { id: 5, name: "Generic Hiring", p1: true, p2: true, p3: false, p4: true },
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-8 w-full">
        
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
         <div className="text-center md:text-left">
             <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight">Pricing & Packages</h1>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Maven Jobs Service Plans</p>
         </div>
         <button 
            onClick={handlePrint}
            className="bg-[#103c7f] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center gap-2 uppercase tracking-wide"
         >
            <Download size={16}/> Print PDF
         </button>
      </div>

      {/* --- PDF CONTENT --- */}
      <div id="pdf-content" className="w-full bg-[#eeeef0] p-4">
            
          {/* PDF Header */}
          <div className="flex justify-between items-end mb-6 border-b-2 border-[#103c7f] pb-4">
              <Image src="/maven-logo.png" alt="Maven Jobs" width={200} height={70} className="object-contain" priority />
              <div className="text-right">
                  <h1 className="text-2xl font-black text-[#103c7f] uppercase">Service Packages</h1>
                  <p className="text-xs text-gray-700 font-bold uppercase tracking-widest">Comparison Overview</p>
              </div>
          </div>

          {/* --- CARDS CONTAINER --- */}
          <div className="grid grid-cols-4 gap-4 w-full items-stretch">
                
              {packages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className="flex flex-col rounded-2xl overflow-hidden relative w-full min-w-0 bg-white border-2"
                    style={{
                      borderColor: pkg.theme.borderColor,
                      boxShadow: pkg.isPopular ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Colored Header Section */}
                    <div 
                      className="px-4 py-4 text-center rounded-t-xl"
                      style={{ backgroundColor: pkg.theme.topBorder }}
                    >
                      <h2 className="text-lg font-black uppercase tracking-tight text-white">
                        {pkg.label}
                      </h2>
                    </div>
                    
                    {/* Body Section - White with rounded top and bottom corners */}
                    <div className="flex-1 flex flex-col rounded-t-xl rounded-b-xl">
                    
                      {/* Price Section */}
                      <div className="p-4 text-center border-b border-gray-100 rounded-t-2xl relative z-10 -mt-4 bg-white">
                        <div>
                          {pkg.price.includes('%') ? (
                            <span className="text-2xl font-black" style={{ color: pkg.theme.priceColor }}>{pkg.price}</span>
                          ) : (
                            <>
                              <span className="text-xl font-bold text-black align-top mr-1">₹</span>
                              <span className="text-2xl font-black" style={{ color: pkg.theme.priceColor }}>{pkg.price}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="p-4 flex-1">
                            <ul className="space-y-3">
                                {features.map((feat) => {
                                    const value = feat[pkg.id];
                                    const isTextValue = typeof value === 'string' && value.length > 0;
                                    const isIncluded = value === true || isTextValue;
                                      
                                    return (
                                        <li key={feat.id} className="flex items-start gap-2.5 min-h-[24px]">
                                            <div className="mt-0.5 shrink-0 w-5 flex justify-center">
                                                {isTextValue ? (
                                                    <Clock size={16} style={{ color: pkg.theme.checkColor }} />
                                                ) : value === true ? (
                                                    <CheckCircle2 size={18} style={{ color: pkg.theme.checkColor }} strokeWidth={2.5} />
                                                ) : (
                                                    <XCircle size={18} className="text-gray-700/80" />
                                                )}
                                            </div>
                                              
                                            <div className="flex flex-col w-full min-w-0">
                                                <span className={`text-[15px] font-bold leading-tight truncate ${isIncluded ? 'text-black' : 'text-gray-700/80'}`}>
                                                    {feat.name}
                                                </span>
                                                  
                                                {isTextValue && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 text-black">
                                                        {value}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                      </div>
                    </div>

                  </div>
              ))}
          </div>

          {/* PDF Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
              <p className="text-[12px] font-bold text-gray-700/80 uppercase tracking-widest">Confidential & Proprietary - Maven Jobs India</p>
          </div>
      </div>

       {/* Print CSS */}
      <style jsx global>{`
        @media print {
            @page { 
                size: A4 landscape; 
                margin: 0; 
                padding: 0;
            }
            @page :left {
                @bottom-left { content: none; }
                @bottom-center { content: none; }
                @bottom-right { content: none; }
            }
            @page :right {
                @bottom-left { content: none; }
                @bottom-center { content: none; }
                @bottom-right { content: none; }
            }
            
            body { 
                background: white; 
                margin: 0; 
                padding: 0; 
            }
            
            /* Hide everything by default */
            * { visibility: hidden; }
            
            /* Show only the PDF content container - fill full page */
            #pdf-content { 
                visibility: visible;
                position: fixed;
                left: 5mm;
                top: 5mm;
                width: calc(100% - 10mm);
                height: calc(100% - 10mm);
                margin: 0;
                padding: 5px;
            }
            
            /* Show all children of PDF content */
            #pdf-content * {
                visibility: visible;
            }
            
            /* Layout Adjustments - Fit in single page */
            #pdf-content .grid { 
                display: grid !important; 
                grid-template-columns: repeat(4, 1fr) !important; 
                gap: 10px !important; 
            }
            
            /* Card styling */
            #pdf-content .overflow-hidden {
                overflow: visible !important;
            }
            
            #pdf-content .rounded-2xl {
                border-radius: 12px !important;
            }
            
            #pdf-content .rounded-t-xl {
                border-top-left-radius: 12px !important;
                border-top-right-radius: 12px !important;
            }
            
            #pdf-content .rounded-b-xl {
                border-bottom-left-radius: 12px !important;
                border-bottom-right-radius: 12px !important;
            }
            
            #pdf-content .text-lg {
                font-size: 14px !important;
            }
            
            #pdf-content .text-\[15px\] {
                font-size: 11px !important;
            }
            
            #pdf-content .space-y-3 > li {
                margin-bottom: 2px !important;
                min-height: 18px !important;
            }
            
            #pdf-content .mt-8 {
                margin-top: 10px !important;
            }
            
            #pdf-content .mb-6 {
                margin-bottom: 8px !important;
            }
            
            #pdf-content .pb-4 {
                padding-bottom: 6px !important;
            }
            
            #pdf-content .pt-4 {
                padding-top: 6px !important;
            }
            
            /* Color Fidelity */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

    </div>
  );
}
