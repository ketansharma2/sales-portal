"use client";
import { useState, useEffect } from "react";
import { Target, Calendar, MapPin, Briefcase, Award, TrendingUp } from "lucide-react";

export default function FSETargetPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fseTargets, setFseTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FETCH FSE INDIVIDUAL TARGETS ---
  const fetchFseTargets = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      // Fetch all targets without month parameter - API returns all rows
      const response = await fetch('/api/domestic/fse/targets', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.targets) {
        const allTargets = result.data.targets.map((target, idx) => ({
          id: target.id || idx + 1,
          month: target.month || null,
          working_days: target.working_days || 0,
          monthly_visits: target.monthly_visits || 0,
          monthly_onboards: target.monthly_onboards || 0,
          monthly_calls: target.monthly_calls || 0,
          monthly_leads: target.monthly_leads || 0,
          ctc_generation: target.ctc_generation || 0,
          remarks: target.remarks || '',
          achieved_visits: target.achieved_visits || 0,
          achieved_onboards: target.achieved_onboards || 0
        }));
        
        // Filter targets based on selected month in frontend
        const filteredTargets = allTargets.filter(target => target.month === selectedMonth);
        setFseTargets(filteredTargets);
      } else {
        setFseTargets([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching FSE targets:', err);
      setError('Failed to fetch targets');
      setFseTargets([]);
    } finally {
      setLoading(false);
    }
  };

  // --- LOAD DATA ---
  useEffect(() => {
    fetchFseTargets();
  }, [selectedMonth]);

  // Get the current target data
  const currentTarget = fseTargets.length > 0 ? fseTargets[0] : null;

  // Helper function to calculate progress color
  const getProgressColor = (achieved, target) => {
    if (!target) return "bg-gray-200";
    const percent = (achieved / target) * 100;
    if (percent > 70) return "bg-green-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper to calculate achievement percentage
  const getAchievementPercent = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.round((achieved / target) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-6 pt-2 pb-12">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
            <Target size={32} /> My Targets
          </h1>
          <p className="text-gray-500 text-sm font-bold mt-1">
            View your individual targets for the month
          </p>
        </div>
        
        {/* Month Selector */}
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-blue-100 text-[#103c7f] p-2 rounded-lg">
            <Calendar size={20} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">
              View Month
            </label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="font-black text-[#103c7f] text-lg bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* --- LOADING --- */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#103c7f] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#103c7f] font-bold">Loading targets...</span>
          </div>
        </div>
      )}

      {/* --- ERROR --- */}
      {!loading && error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
          <p className="text-red-600 font-bold">{error}</p>
        </div>
      )}

      {/* --- NO TARGETS --- */}
      {!loading && !error && !currentTarget && (
        <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center">
          <Target size={48} className="mx-auto text-blue-300 mb-4" />
          <p className="text-blue-600 font-bold text-lg">No targets assigned for {selectedMonth ? new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'this month'}</p>
          <p className="text-blue-400 text-sm mt-1">Please contact your manager for target assignment.</p>
        </div>
      )}

      {/* --- FSE INDIVIDUAL TARGETS --- */}
      {!loading && !error && currentTarget && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* =========================================================================================
               TOP SECTION - 4 CARDS IN A SINGLE ROW (Inside bordered container)
          ========================================================================================= */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            
            {/* Grid of 4 compact cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
              
                {/* Monthly Visits Card */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                      <div className="bg-blue-100 p-0.5 rounded">
                        <MapPin size={8} className="text-blue-600" />
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 uppercase">Monthly Visits</span>
                    </div>
                  </div>
                  <div className="text-center py-0">
                    <span className="block text-base font-black text-blue-700">{currentTarget.monthly_visits || 0}</span>
                    <span className="text-[9px] text-blue-400 font-bold">target visits</span>
                  </div>
                  <div className="mt-0.5 pt-0.5 border-t border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-blue-600">Per Day:</span>
                      <span className="bg-blue-600 text-white px-1 py-0.5 rounded text-[9px] font-bold">
                        {currentTarget.working_days ? Math.round((currentTarget.monthly_visits || 0) / currentTarget.working_days) : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monthly Onboards Card */}
                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                      <div className="bg-green-100 p-0.5 rounded">
                        <Briefcase size={8} className="text-green-600" />
                      </div>
                      <span className="text-[9px] font-bold text-green-600 uppercase">Monthly Onboards</span>
                    </div>
                  </div>
                  <div className="text-center py-0">
                    <span className="block text-base font-black text-green-700">{currentTarget.monthly_onboards || 0}</span>
                    <span className="text-[9px] text-green-400 font-bold">target onboards</span>
                  </div>
                </div>

                {/* CTC Generation Card */}
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                      <div className="bg-red-100 p-0.5 rounded">
                        <Award size={8} className="text-red-600" />
                      </div>
                      <span className="text-[9px] font-bold text-red-600 uppercase">CTC Generation</span>
                    </div>
                  </div>
                  <div className="text-center py-0">
                    <span className="block text-base font-black text-red-700">{currentTarget.ctc_generation || 0}</span>
                    <span className="text-[9px] text-red-400 font-bold">target CTC</span>
                  </div>
                </div>

                {/* Working Days Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                      <div className="bg-gray-100 p-0.5 rounded">
                        <Calendar size={8} className="text-gray-600" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-600 uppercase">Working Days</span>
                    </div>
                  </div>
                  <div className="text-center py-0">
                    <span className="block text-base font-black text-gray-700">{currentTarget.working_days || 0}</span>
                    <span className="text-[9px] text-gray-400 font-bold">days this month</span>
                  </div>
                </div>
            </div>

            {/* Manager's Remarks - Inside the same bordered container */}
            {currentTarget.remarks && (
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-yellow-100 p-1.5 rounded-lg">
                    <Target size={14} className="text-yellow-600" />
                  </div>
                  <span className="text-[10px] font-bold text-yellow-600 uppercase">Manager's Remarks</span>
                </div>
                <p className="text-xs text-gray-700 font-medium">{currentTarget.remarks}</p>
              </div>
            )}
          </div>

          {/* =========================================================================================
               BOTTOM SECTION - PERFORMANCE CARD
          ========================================================================================= */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Performance Header */}
            <div className="bg-gradient-to-r from-[#103c7f] to-blue-600 p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Performance Overview</h3>
                  <p className="text-blue-100 text-xs font-medium">
                    {selectedMonth ? new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'Select Month'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-blue-100 text-xs font-bold uppercase block">Overall Achievement</span>
                {(() => {
                  const criteria = [];
                  if ((currentTarget.monthly_visits || 0) > 0) {
                    criteria.push(((currentTarget.achieved_visits || 0) / currentTarget.monthly_visits) * 100);
                  }
                  if ((currentTarget.monthly_onboards || 0) > 0) {
                    criteria.push(((currentTarget.achieved_onboards || 0) / currentTarget.monthly_onboards) * 100);
                  }
                  const achievement = criteria.length > 0 ? Math.round(criteria.reduce((a, b) => a + b, 0) / criteria.length) : 0;
                  return (
                    <span className={`block text-3xl font-black ${achievement > 70 ? 'text-green-300' : achievement >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {achievement}%
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="p-6 space-y-6">
              
              {/* Visits Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-gray-700">Monthly Visits</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      <span className="font-bold text-blue-600">{currentTarget.achieved_visits || 0}</span> 
                      <span className="mx-1">/</span>
                      <span className="font-bold text-gray-700">{currentTarget.monthly_visits || 0}</span>
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      getAchievementPercent(currentTarget.achieved_visits, currentTarget.monthly_visits) > 70 
                        ? 'bg-green-100 text-green-700' 
                        : getAchievementPercent(currentTarget.achieved_visits, currentTarget.monthly_visits) >= 50 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {getAchievementPercent(currentTarget.achieved_visits, currentTarget.monthly_visits)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(currentTarget.achieved_visits, currentTarget.monthly_visits)}`} 
                    style={{width: `${currentTarget.monthly_visits > 0 ? ((currentTarget.achieved_visits || 0)/currentTarget.monthly_visits)*100 : 0}%`}}
                  ></div>
                </div>
              </div>

              {/* Onboards Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-green-600" />
                    <span className="text-sm font-bold text-gray-700">Monthly Onboards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      <span className="font-bold text-green-600">{currentTarget.achieved_onboards || 0}</span> 
                      <span className="mx-1">/</span>
                      <span className="font-bold text-gray-700">{currentTarget.monthly_onboards || 0}</span>
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      getAchievementPercent(currentTarget.achieved_onboards, currentTarget.monthly_onboards) > 70 
                        ? 'bg-green-100 text-green-700' 
                        : getAchievementPercent(currentTarget.achieved_onboards, currentTarget.monthly_onboards) >= 50 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {getAchievementPercent(currentTarget.achieved_onboards, currentTarget.monthly_onboards)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(currentTarget.achieved_onboards, currentTarget.monthly_onboards)}`} 
                    style={{width: `${currentTarget.monthly_onboards > 0 ? ((currentTarget.achieved_onboards || 0)/currentTarget.monthly_onboards)*100 : 0}%`}}
                  ></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
