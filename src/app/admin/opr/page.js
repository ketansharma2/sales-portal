"use client";
import { Printer, LayoutDashboard } from "lucide-react";

// --- MOCK DATA EXACTLY BASED ON PDF STRUCTURE ---
const OPR_DATA = {
    sales: {
        corporate: { leads: "21", pipelineClients: "-", onboard: "-", reqProfiles: "not full filled", totalReq: "req * one CTC", totalCtc: "req no. of position" },
        franchise: { formShared: 5, acceptance: 2 },
        domestic: { leads: 150, pipelineClients: 45, onboard: 12, reqProfiles: 30, totalReq: 10, totalCtc: "1.5 Cr" },
        jobPost: { total: 595, live: 400, paused: 150, deleted: 30, flagged: 15, cvByJobPost: 1200 }
    },
    delivery: {
        corporate: { cvParse: 450, trackerShare: 120, interview: 45, joining: 10, recoveryBy: "Self", amountReceived: "₹5L" },
        domestic: { cvParse: 1200, trackerShare: 350, interview: 150, joining: 45, recoveryBy: "Agency", amountReceived: "₹12L" }
    },
    dataMgmt: { sheets: 26, mailId: 15, tools: 8 },
    monitor: {
        scanner: { application: 5, company: 12, user: 45 },
        searchbar: { view: 1500, cvDownload: 320, user: 85 },
        wpr: { totalUser: 120, fill: 95 },
        cafeApp: { orders: 450, completed: 400, rejected: 50, menuItems: 45, user: 150 }
    },
    tech: {
        sales: { totalUser: 25, errors: 3, addons: 2 },
        delivery: { totalUser: 40, errors: 5, addons: 4 }
    },
    development: {
        inHouse: { totalProject: 12, done: 8, inProgress: 3, pending: 1 },
        outSource: { totalProject: 4, done: 2, inProgress: 1, pending: 1 }
    },
    dm: {
        inHouse: { company: 3, platforms: 5, postDesign: 45, postPublish: 40, backlink: 150, linkedinConn: 500 },
        outSource: { postPublish: 20, leadsGen: 85 }
    }
};

export default function AdminOperationReport() {
    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-3 md:p-6 print:bg-white print:p-0">
            
            {/* --- HEADER --- */}
            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Operations Report</h1>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Master KPI Overview</p>
                    </div>
                </div>
                <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                    <Printer size={16} /> Print Report
                </button>
            </div>

            {/* --- PRINT HEADER (Only visible in print) --- */}
            <div className="hidden print:flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-2">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Master Operations Report</h1>
                <p className="text-xs font-bold text-slate-500">{new Date().toLocaleString('en-GB')}</p>
            </div>

            {/* --- MASTER SPREADSHEET TABLE --- */}
            <div className="overflow-x-auto bg-white shadow-sm border border-slate-300 max-w-7xl mx-auto print:shadow-none print:border-none">
                <table className="w-full border-collapse text-xs text-center">
                    
                    {/* ================= SALES ================= */}
                    <thead>
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2 w-[10%]">Department</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Sector</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Leads</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Pipeline</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Onboard</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Req Profiles</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Total Req</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Total CTC</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Fran. Form</th>
                            <th className="border border-slate-300 p-2 w-[10%]">Fran. Accept</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="4">Sales</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-indigo-700">Corporate</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.corporate.leads}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.corporate.pipelineClients}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.corporate.onboard}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.corporate.reqProfiles}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.corporate.totalReq}</td>
                            <td className="border border-slate-300 p-2 font-bold text-emerald-700 bg-emerald-50/50">{OPR_DATA.sales.corporate.totalCtc}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.franchise.formShared}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.franchise.acceptance}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-orange-700">Domestic</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.domestic.leads}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.domestic.pipelineClients}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.domestic.onboard}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.domestic.reqProfiles}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.sales.domestic.totalReq}</td>
                            <td className="border border-slate-300 p-2 font-bold text-emerald-700 bg-emerald-50/50">{OPR_DATA.sales.domestic.totalCtc}</td>
                            <td className="border border-slate-300 p-2 bg-slate-50" colSpan="2"></td>
                        </tr>
                        {/* Job Post Nested Headers */}
                        <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-blue-700 align-middle" rowSpan="2">Job Post</td>
                            <td className="border border-slate-300 p-2">Total Job Post</td>
                            <td className="border border-slate-300 p-2">Live</td>
                            <td className="border border-slate-300 p-2">Paused</td>
                            <td className="border border-slate-300 p-2">Deleted</td>
                            <td className="border border-slate-300 p-2">Flagged</td>
                            <td className="border border-slate-300 p-2" colSpan="3">CV by JOB Post</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold">{OPR_DATA.sales.jobPost.total}</td>
                            <td className="border border-slate-300 p-2 text-emerald-600 font-bold">{OPR_DATA.sales.jobPost.live}</td>
                            <td className="border border-slate-300 p-2 text-amber-600 font-bold">{OPR_DATA.sales.jobPost.paused}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold">{OPR_DATA.sales.jobPost.deleted}</td>
                            <td className="border border-slate-300 p-2 text-red-600 font-bold">{OPR_DATA.sales.jobPost.flagged}</td>
                            <td className="border border-slate-300 p-2 font-black text-blue-700 bg-blue-50/30" colSpan="3">{OPR_DATA.sales.jobPost.cvByJobPost}</td>
                        </tr>

                        {/* ================= DELIVERY ================= */}
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2">Department</th>
                            <th className="border border-slate-300 p-2">Sector</th>
                            <th className="border border-slate-300 p-2">CV Parse</th>
                            <th className="border border-slate-300 p-2">Tracker Share</th>
                            <th className="border border-slate-300 p-2">Interview</th>
                            <th className="border border-slate-300 p-2">Joining</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Recovery By</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Amount Received</th>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="2">Delivery</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-indigo-700">Corporate</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.corporate.cvParse}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.corporate.trackerShare}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.corporate.interview}</td>
                            <td className="border border-slate-300 p-2 font-bold text-emerald-600">{OPR_DATA.delivery.corporate.joining}</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.delivery.corporate.recoveryBy}</td>
                            <td className="border border-slate-300 p-2 font-black text-emerald-700 bg-emerald-50/50" colSpan="2">{OPR_DATA.delivery.corporate.amountReceived}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-orange-700">Domestic</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.domestic.cvParse}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.domestic.trackerShare}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.delivery.domestic.interview}</td>
                            <td className="border border-slate-300 p-2 font-bold text-emerald-600">{OPR_DATA.delivery.domestic.joining}</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.delivery.domestic.recoveryBy}</td>
                            <td className="border border-slate-300 p-2 font-black text-emerald-700 bg-emerald-50/50" colSpan="2">{OPR_DATA.delivery.domestic.amountReceived}</td>
                        </tr>

                        {/* ================= DATA MGMT ================= */}
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2">Department</th>
                            <th className="border border-slate-300 p-2">Sheets</th>
                            <th className="border border-slate-300 p-2">Mail ID</th>
                            <th className="border border-slate-300 p-2" colSpan="7">Tools</th>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle">Data Mgmt</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.dataMgmt.sheets}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.dataMgmt.mailId}</td>
                            <td className="border border-slate-300 p-2" colSpan="7">{OPR_DATA.dataMgmt.tools}</td>
                        </tr>

                        {/* ================= MONITOR ================= */}
                        <tr>
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="8">Monitor</td>
                            
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Scanner</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Application</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Company</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider" colSpan="5">User</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50"></td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.scanner.application}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.scanner.company}</td>
                            <td className="border border-slate-300 p-2" colSpan="5">{OPR_DATA.monitor.scanner.user}</td>
                        </tr>
                        
                        <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Searchbar</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">View</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">CV Download</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider" colSpan="5">User</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50"></td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.searchbar.view}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.searchbar.cvDownload}</td>
                            <td className="border border-slate-300 p-2" colSpan="5">{OPR_DATA.monitor.searchbar.user}</td>
                        </tr>

                        <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">WPR</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider" colSpan="2">Total User</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider" colSpan="5">Fill</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50"></td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.monitor.wpr.totalUser}</td>
                            <td className="border border-slate-300 p-2 text-emerald-600 font-bold" colSpan="5">{OPR_DATA.monitor.wpr.fill}</td>
                        </tr>

                        <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Cafe App</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Orders</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Completed</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Rejected</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">Menu Items</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider" colSpan="3">User</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50"></td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.cafeApp.orders}</td>
                            <td className="border border-slate-300 p-2 text-emerald-600 font-bold">{OPR_DATA.monitor.cafeApp.completed}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold">{OPR_DATA.monitor.cafeApp.rejected}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.monitor.cafeApp.menuItems}</td>
                            <td className="border border-slate-300 p-2" colSpan="3">{OPR_DATA.monitor.cafeApp.user}</td>
                        </tr>

                        {/* ================= TECH ================= */}
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2">Department</th>
                            <th className="border border-slate-300 p-2">Sector</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Total User</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Errors</th>
                            <th className="border border-slate-300 p-2" colSpan="4">Addons</th>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="2">Tech</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Sales</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.tech.sales.totalUser}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold" colSpan="2">{OPR_DATA.tech.sales.errors}</td>
                            <td className="border border-slate-300 p-2 text-indigo-600 font-bold" colSpan="4">{OPR_DATA.tech.sales.addons}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Delivery</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.tech.delivery.totalUser}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold" colSpan="2">{OPR_DATA.tech.delivery.errors}</td>
                            <td className="border border-slate-300 p-2 text-indigo-600 font-bold" colSpan="4">{OPR_DATA.tech.delivery.addons}</td>
                        </tr>

                        {/* ================= DEVELOPMENT ================= */}
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2">Department</th>
                            <th className="border border-slate-300 p-2">Sector</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Total Project</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Done</th>
                            <th className="border border-slate-300 p-2" colSpan="2">In Progress</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Pending</th>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="2">Development</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">In-House</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.development.inHouse.totalProject}</td>
                            <td className="border border-slate-300 p-2 text-emerald-600 font-bold" colSpan="2">{OPR_DATA.development.inHouse.done}</td>
                            <td className="border border-slate-300 p-2 text-amber-600 font-bold" colSpan="2">{OPR_DATA.development.inHouse.inProgress}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold" colSpan="2">{OPR_DATA.development.inHouse.pending}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Out Source</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.development.outSource.totalProject}</td>
                            <td className="border border-slate-300 p-2 text-emerald-600 font-bold" colSpan="2">{OPR_DATA.development.outSource.done}</td>
                            <td className="border border-slate-300 p-2 text-amber-600 font-bold" colSpan="2">{OPR_DATA.development.outSource.inProgress}</td>
                            <td className="border border-slate-300 p-2 text-rose-600 font-bold" colSpan="2">{OPR_DATA.development.outSource.pending}</td>
                        </tr>

                        {/* ================= DM ================= */}
                        <tr className="bg-slate-200 font-black uppercase text-slate-700 text-[10px] tracking-wider">
                            <th className="border border-slate-300 p-2">Department</th>
                            <th className="border border-slate-300 p-2">Sector</th>
                            <th className="border border-slate-300 p-2">Company</th>
                            <th className="border border-slate-300 p-2">Platforms</th>
                            <th className="border border-slate-300 p-2">Post Design</th>
                            <th className="border border-slate-300 p-2">Post Publish</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Backlink</th>
                            <th className="border border-slate-300 p-2" colSpan="2">Linkedin Conn</th>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2 font-black bg-slate-50 text-slate-800 uppercase tracking-widest align-middle" rowSpan="4">DM</td>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">In-House</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.dm.inHouse.company}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.dm.inHouse.platforms}</td>
                            <td className="border border-slate-300 p-2">{OPR_DATA.dm.inHouse.postDesign}</td>
                            <td className="border border-slate-300 p-2 text-blue-600 font-bold">{OPR_DATA.dm.inHouse.postPublish}</td>
                            <td className="border border-slate-300 p-2" colSpan="2">{OPR_DATA.dm.inHouse.backlink}</td>
                            <td className="border border-slate-300 p-2 text-blue-600 font-bold" colSpan="2">{OPR_DATA.dm.inHouse.linkedinConn}</td>
                        </tr>
                        
                        <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 align-middle" rowSpan="2">Out-Source</td>
                            <td className="border border-slate-300 p-2" colSpan="4">Post Publish</td>
                            <td className="border border-slate-300 p-2" colSpan="4">Leads Gen.</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2" colSpan="4">{OPR_DATA.dm.outSource.postPublish}</td>
                            <td className="border border-slate-300 p-2 font-bold text-emerald-700 bg-emerald-50/50" colSpan="4">{OPR_DATA.dm.outSource.leadsGen}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* --- STRICT A4 PRINT CSS --- */}
           {/* --- STRICT A4 PRINT CSS --- */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    /* Reset everything for print */
                    body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Hide non-printable elements */
                    .print\\:hidden { display: none !important; }
                    
                    /* Remove heavy styling to save ink and space */
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    
                    /* Master Container - Force it to be exactly the page width */
                    .overflow-x-auto { 
                        overflow: visible !important; /* Removes the scrollbar */
                        width: 100% !important; 
                        max-width: 100% !important; 
                    }
                    
                    /* Define A4 size and layout */
                    @page { 
                        size: A4 landscape; 
                        margin: 10mm;
                    }

                    /* Table adjustments to fit screen */
                    table { 
                        width: 100% !important; 
                        border: 1px solid #cbd5e1; 
                        table-layout: fixed; /* Forces columns to fit */
                        word-wrap: break-word;
                    }
                    
                    /* Tightly pack table cells */
                    th, td { 
                        border: 1px solid #cbd5e1 !important; 
                        padding: 4px !important; /* Reduced padding */
                        font-size: 8pt !important; /* Slightly smaller font */
                        color: #0f172a !important; 
                    }
                    
                    /* Preserve Background Colors */
                    .bg-slate-200 { background-color: #e2e8f0 !important; }
                    .bg-slate-100 { background-color: #f1f5f9 !important; }
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-emerald-50\\/50 { background-color: #ecfdf5 !important; }
                    
                    /* Text Sizing */
                    h1 { font-size: 14pt !important; margin-bottom: 0 !important; }
                    .text-\\[10px\\] { font-size: 6pt !important; }
                    .tracking-widest { letter-spacing: normal !important; } /* Saves horizontal space */
                    
                    /* Ensure no random page breaks */
                    tr { break-inside: avoid; page-break-inside: avoid; }
                }
            `}} />
        </div>
    );
}