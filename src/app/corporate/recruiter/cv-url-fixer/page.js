"use client";
import { useState } from "react";
import { Download, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CVUrlFixer() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [brokenUrls, setBrokenUrls] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [updateResults, setUpdateResults] = useState(null);

  const step1CheckUrls = async () => {
    setLoading(true);
    setStep(1);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch("/api/corporate/recruiter/check-cv-urls", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.success) {
        setBrokenUrls(result.broken_urls || []);
        console.log("Broken URLs:", result.broken_urls);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const step2TestDoubleEncoded = async () => {
    if (brokenUrls.length === 0) return;
    setLoading(true);
    setStep(2);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch("/api/corporate/recruiter/test-double-encoded-urls", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls: brokenUrls })
      });
      const result = await response.json();
      if (result.success) {
        setTestResults(result.results || []);
        console.log("Test results:", result.results);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const step3UpdateUrls = async () => {
    const workingUrls = testResults.filter(r => r.status === 'working');
    if (workingUrls.length === 0) return;
    setLoading(true);
    setStep(3);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch("/api/corporate/recruiter/update-fixed-urls", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls: workingUrls })
      });
      const result = await response.json();
      if (result.success) {
        setUpdateResults(result);
        console.log("Update results:", result);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const downloadExcel = (data, filename) => {
    const csv = "ID,Name,Portal,CV_URL\n" + data.map(r => 
      `"${r.id}","${r.name || ''}","${r.portal || ''}","${r.cv_url || r.fixed_url || r.original_url || ''}"`
    ).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-slate-800 mb-6">CV URL Fixer Tool</h1>
        
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
            <div className={`h-1 flex-1 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
            <div className={`h-1 flex-1 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>3</div>
          </div>

          <div className="flex gap-4 mb-6">
            <button onClick={step1CheckUrls} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
              <RefreshCw size={16} className={loading && step === 1 ? 'animate-spin' : ''}/>
              Step 1: Check Broken URLs
            </button>

            <button onClick={step2TestDoubleEncoded} disabled={loading || brokenUrls.length === 0} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50">
              <Loader2 size={16} className={loading && step === 2 ? 'animate-spin' : ''}/>
              Step 2: Test Double Encoded
            </button>

            <button onClick={step3UpdateUrls} disabled={loading || testResults.length === 0} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
              <CheckCircle size={16} className={loading && step === 3 ? 'animate-spin' : ''}/>
              Step 3: Update DB
            </button>
          </div>

          <div className="text-sm text-slate-600">
            <p>Step 1: Check all CV URLs and find broken ones</p>
            <p>Step 2: Try double encoding on broken URLs</p>
            <p>Step 3: Update working URLs in database</p>
          </div>
        </div>

        {brokenUrls.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Broken URLs: {brokenUrls.length}</h2>
              <button onClick={() => downloadExcel(brokenUrls, 'broken_urls.csv')} className="flex items-center gap-2 bg-slate-600 text-white px-3 py-1.5 rounded text-sm">
                <Download size={14}/> Download CSV
              </button>
            </div>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Test Results: {testResults.filter(r => r.status === 'working').length} working</h2>
              <button onClick={() => downloadExcel(testResults, 'test_results.csv')} className="flex items-center gap-2 bg-slate-600 text-white px-3 py-1.5 rounded text-sm">
                <Download size={14}/> Download CSV
              </button>
            </div>
          </div>
        )}

        {updateResults && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-black text-lg text-green-600">Updated: {updateResults.total_updated} URLs</h2>
            {updateResults.updated && updateResults.updated.length > 0 && (
              <button onClick={() => downloadExcel(updateResults.updated, 'updated_urls.csv')} className="flex items-center gap-2 mt-4 bg-green-600 text-white px-3 py-1.5 rounded text-sm">
                <Download size={14}/> Download Updated List
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}