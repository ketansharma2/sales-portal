"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer, ArrowLeft, Download } from "lucide-react";


export default function JDPreviewPage() {
    const [viewJdData, setViewJdData] = useState(null);

    useEffect(() => {
        // LocalStorage से JD का डेटा निकालें
        const data = localStorage.getItem('previewJD');
        if (data) {
            setViewJdData(JSON.parse(data));
        }
    }, []);

    // सिंपल प्रिंट (या अगर आपने html2canvas वाला कोड रखा है तो वो डालें)
    const generatePDF = () => {
        window.print();
    };

    if (!viewJdData) {
        return <div className="p-10 text-center text-xl font-bold text-gray-500">Loading Job Description...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-200 py-10 print:py-0 print:bg-white font-['Calibri']">
            
            {/* --- TOP ACTION BAR (Hidden in Print) --- */}
            <div className="w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
                <button 
                    onClick={() => window.close()} 
                    className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition font-bold"
                >
                    <ArrowLeft size={16}/> Close Preview
                </button>

                <button 
                    onClick={generatePDF} 
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg shadow-lg transition font-bold tracking-wider uppercase text-sm"
                >
                    <Download size={18}/> Print / Save as PDF
                </button>
            </div>

            {/* --- A4 SIZE PDF CONTENT --- */}
            <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-[15mm] shadow-2xl relative print:shadow-none print:m-0 print:w-full" id="pdf-content">
                
                {/* 1. Header Logo */}
                <div className="mb-10">
                    <Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority />
                </div>

                {/* 2. Bordered Container */}
                <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                    
                    {/* Key Value Pairs */}
                    <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                        {viewJdData.job_title && <p><span className="font-bold">JOB TITLE : </span> {viewJdData.job_title}</p>}
                        {viewJdData.location && <p><span className="font-bold">LOCATION : </span> {viewJdData.location}</p>}
                        {viewJdData.experience && <p><span className="font-bold">EXPERIENCE : </span> {viewJdData.experience}</p>}
                        {viewJdData.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {viewJdData.employment_type}</p>}
                        {viewJdData.working_days && <p><span className="font-bold">WORKING DAYS : </span> {viewJdData.working_days}</p>}
                        {viewJdData.timings && <p><span className="font-bold">TIMINGS : </span> {viewJdData.timings}</p>}
                        {viewJdData.package && <p><span className="font-bold">PACKAGE : </span> {viewJdData.package}</p>}
                        {viewJdData.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {viewJdData.tool_requirement}</p>}
                    </div>

                    {/* Sections */}
                    <div className="space-y-8 text-[15px]">
                        {viewJdData.job_summary && (
                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{viewJdData.job_summary}</p></div>
                        )}
                        
                        {viewJdData.rnr && (
                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                    {viewJdData.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {viewJdData.req_skills && (
                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                    {viewJdData.req_skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {viewJdData.preferred_qual && (
                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                    {viewJdData.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {viewJdData.company_offers && (
                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                    {viewJdData.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {viewJdData.contact_details && (
                            <div className="mt-12 pt-6 border-t border-black/20">
                                <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{viewJdData.contact_details}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

          {/* --- STRICT PRINT CSS --- */}
         {/* --- STRICT PRINT CSS --- */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 8mm; 
                    }
                    
                    html, body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        height: auto !important; 
                        overflow: visible !important;
                    }

                    .print\\:hidden { 
                        display: none !important; 
                    }

                    #pdf-content {
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    .print\\:border-none {
                        min-height: auto !important;
                    }

                    /* 1. हेडिंग्स को कंटेंट से अलग होने से रोकें (Heading पेज के अंत में न छूटे) */
                    h1, h2, h3, h4 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        margin-bottom: 8px !important;
                    }

                    /* 2. किसी एक पैराग्राफ या लिस्ट आइटम को बीच से आधा कटने से रोकें */
                    p, li {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* 3. मेन कंटेनर्स को टूटने की परमिशन दें (ताकि खाली जगह न छूटे) */
                    div {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }
                    
                    /* टॉप वाले Key-Value पेयर्स (Job Title, Location) को एक साथ रखें */
                    .leading-relaxed > p {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}} />
        </div>
    );
}