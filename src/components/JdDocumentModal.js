"use client";
import { useRef } from "react";
import { FileText, X, Download } from "lucide-react";

/**
 * Reusable Job-Description document preview + "Save as PDF" modal.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   const [jd, setJd] = useState(null);
 *   ...
 *   <JdDocumentModal isOpen={open} jd={jd} onClose={() => setOpen(false)} />
 *
 * Props:
 *   isOpen  boolean  - whether the modal is shown
 *   jd      object   - the job-description record (title, location, summary, rnr, ...)
 *   onClose fn       - called when the modal should close
 */
export default function JdDocumentModal({ isOpen, jd, onClose }) {
    const headerRef = useRef(null);
    const bodyRef = useRef(null);

    if (!isOpen || !jd) return null;

    const handleSaveAsPdf = async () => {
        const headerEl = headerRef.current;
        const bodyEl = bodyRef.current;
        if (!headerEl || !bodyEl) {
            alert("PDF content not found");
            return;
        }

        // Clean filename from the job title.
        const jobTitle = jd?.title || "job_description";
        const fileName =
            jobTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") ||
            "job_description";

        try {
            // Load client-only libs dynamically. html2canvas-pro is a drop-in fork of
            // html2canvas that natively supports the oklch() colors Tailwind v4 emits
            // (the stock html2canvas throws "unsupported color function 'oklch'").
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import("html2canvas-pro"),
                import("jspdf"),
            ]);

            // Capture the logo header and body content SEPARATELY, so the header can
            // repeat on every page and the body border can be drawn fresh per page
            // (rather than slicing one big image, which splits the border across pages).
            const headerCanvas = await html2canvas(headerEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });
            const bodyCanvas = await html2canvas(bodyEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                // Strip the box border while capturing; we redraw it per page with pdf.rect().
                onclone: (doc, el) => {
                    el.style.border = "none";
                },
            });

            const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Margins reserved on EVERY page (mm).
            const marginTop = 12;
            const marginBottom = 12;
            const marginX = 10;
            const gap = 4; // space between logo and the bordered box
            const usableWidthMm = pageWidth - marginX * 2;

            // Header drawn full usable width, aspect ratio preserved.
            const headerHeightMm = (headerCanvas.height / headerCanvas.width) * usableWidthMm;

            // Bordered body box: from just under the header down to the bottom margin.
            const boxTop = marginTop + headerHeightMm + gap;
            const boxHeightMm = pageHeight - marginBottom - boxTop;

            // Body content is drawn to the full box width; scale + per-page height in px.
            const pxPerMm = bodyCanvas.width / usableWidthMm;
            const pageBodyPx = boxHeightMm * pxPerMm;

            // Safe cut points (element bottoms) so a page break never lands mid-line.
            const bodyRect = bodyEl.getBoundingClientRect();
            const domScale = bodyCanvas.width / bodyRect.width; // css px -> canvas px
            const breakSet = new Set();
            bodyEl
                .querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, tr, img, div, section, ul, ol, table")
                .forEach((el) => {
                    const bottom = (el.getBoundingClientRect().bottom - bodyRect.top) * domScale;
                    if (bottom > 0 && bottom < bodyCanvas.height) breakSet.add(Math.round(bottom));
                });
            const breaks = [...breakSet].sort((a, b) => a - b);

            const headerData = headerCanvas.toDataURL("image/jpeg", 0.98);

            let renderedPx = 0;
            let pageIndex = 0;
            while (renderedPx < bodyCanvas.height - 1) {
                let sliceEnd = renderedPx + pageBodyPx;
                if (sliceEnd < bodyCanvas.height) {
                    // Back off to the last element boundary that fits on this page,
                    // but not so far back that the page becomes mostly empty.
                    const minEnd = renderedPx + pageBodyPx * 0.3;
                    let candidate = 0;
                    for (const b of breaks) {
                        if (b > minEnd && b <= sliceEnd) candidate = b;
                        else if (b > sliceEnd) break;
                    }
                    if (candidate) sliceEnd = candidate;
                } else {
                    sliceEnd = bodyCanvas.height;
                }

                const sliceHeight = Math.round(sliceEnd - renderedPx);
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = bodyCanvas.width;
                pageCanvas.height = sliceHeight;
                const ctx = pageCanvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(bodyCanvas, 0, renderedPx, bodyCanvas.width, sliceHeight, 0, 0, bodyCanvas.width, sliceHeight);
                const sliceData = pageCanvas.toDataURL("image/jpeg", 0.98);
                const sliceHeightMm = sliceHeight / pxPerMm;

                if (pageIndex > 0) pdf.addPage();

                // 1) Logo header (repeated on every page)
                pdf.addImage(headerData, "JPEG", marginX, marginTop, usableWidthMm, headerHeightMm);
                // 2) Fresh border box (full height, so every page looks consistent)
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(0.3);
                pdf.rect(marginX, boxTop, usableWidthMm, boxHeightMm);
                // 3) This page's slice of the body content, aligned to the top of the box
                pdf.addImage(sliceData, "JPEG", marginX, boxTop, usableWidthMm, sliceHeightMm);

                renderedPx = sliceEnd;
                pageIndex++;
            }

            pdf.save(`${fileName}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF:", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    const splitLines = (value) =>
        String(value || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

    return (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[10000] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto">
            <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none print:overflow-visible">

                {/* Header (Hidden in Print) */}
                <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                    <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveAsPdf}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider"
                        >
                            <Download size={16} /> Save as PDF
                        </button>
                        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* --- PDF CONTENT --- */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:block print:overflow-visible print:bg-white print:p-0 custom-scrollbar">
                    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none" id="pdf-content">

                        {/* 1. Header Logo */}
                        <div className="mb-10" ref={headerRef}>
                            <img src="/maven-logo.png" alt="Maven Jobs" style={{ width: "220px", height: "70px", objectFit: "contain" }} />
                        </div>

                        {/* 2. Bordered Container */}
                        <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0" ref={bodyRef}>

                            {/* Key Value Pairs */}
                            <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                {jd.title && <p><span className="font-bold">JOB TITLE : </span> {jd.title}</p>}
                                {jd.location && <p><span className="font-bold">LOCATION : </span> {jd.location}</p>}
                                {jd.experience && <p><span className="font-bold">EXPERIENCE : </span> {jd.experience}</p>}
                                {jd.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {jd.employment_type}</p>}
                                {jd.working_days && <p><span className="font-bold">WORKING DAYS : </span> {jd.working_days}</p>}
                                {jd.timings && <p><span className="font-bold">TIMINGS : </span> {jd.timings}</p>}
                                {jd.package_salary && <p><span className="font-bold">PACKAGE : </span> {jd.package_salary}</p>}
                                {jd.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {jd.tool_requirement}</p>}
                            </div>

                            {/* Sections */}
                            <div className="space-y-8 text-[15px]">
                                {jd.summary && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{jd.summary}</p></div>
                                )}

                                {jd.rnr && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {splitLines(jd.rnr).map((line, i) => <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {jd.skills && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {splitLines(jd.skills).map((line, i) => <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {jd.preferred_qual && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {splitLines(jd.preferred_qual).map((line, i) => <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {jd.company_offers && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {splitLines(jd.company_offers).map((line, i) => <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {jd.contact_details && (
                                    <div className="mt-12 pt-6 border-t border-black/20">
                                        <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                        <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{jd.contact_details}</div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
