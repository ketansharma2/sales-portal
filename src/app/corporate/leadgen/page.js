"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  TrendingUp, UserCheck, FileText, Briefcase, Award, Send,
  Rocket, ChevronDown, Filter, PhoneOutgoing, PhoneIncoming, PhoneMissed,
  MessageSquare
} from "lucide-react";

// --- Helper function to build filter URL ---
const buildFilterUrl = (router, fromDate, toDate, isAllData, filters) => {
  const params = new URLSearchParams();
  
  if (!isAllData && fromDate && toDate) {
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All') {
      if (key === 'status') params.append('status', value);
      if (key === 'subStatus') params.append('subStatus', value);
      if (key === 'franchiseStatus') params.append('franchiseStatus', value);
      if (key === 'startup') params.append('startup', value);
      if (key === 'isSubmitted') params.append('isSubmitted', value);
      if (key === 'cardType') params.append('cardType', value);
    }
  });
  
  const queryString = params.toString();
  router.push(`/corporate/leadgen/details${queryString ? '?' + queryString : ''}`);
};

export default function LeadGenHome() {
  const router = useRouter();
  
  // --- STATE ---
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isAllData, setIsAllData] = useState(false);
  const [latestInteractionDate, setLatestInteractionDate] = useState('');
  
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [selectedLabel, setSelectedLabel] = useState("Today");
  const [kpiData, setKpiData] = useState({
    searched: { total: '-', startup: '-' },
    normal: { leads: '-', calls: '-' },
    contacts: { total: '-', startup: '-' },
    calls: { total: '-', startup: '-', new: { total: '-', startup: '-' }, followup: { total: '-', startup: '-' } },
    picked: { total: '-', startup: '-' },
    notPicked: { total: '-', startup: '-' },
    contract: { total: '-', startup: '-' },
    sentToManager: { total: '-', startup: '-' },
    onboarded: { total: '-', startup: '-' },
    interested: { total: '-', startup: '-' },
    
    masterUnion: { company: '-', profiles: '-', calling: '-' },

    franchise: {
        discussed: { total: '-', startup: '-' },
        formAsk: { total: '-', startup: '-' },
        formShared: { total: '-', startup: '-' },
        accepted: { total: '-', startup: '-' }
    }
  });

  const [followUps, setFollowUps] = useState([]);
  const [conversationLog, setConversationLog] = useState([]);

  const fetchTodayFollowUps = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/leadgen/today-followups', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFollowUps(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch today follow-ups:', error);
    }
  };

  const fetchConversationLog = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/conversation-log?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      console.log('Conversation log API response:', data);
      if (data.success && data.data) {
        setConversationLog(data.data.conversationLog || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversation log:', error);
    }
  };

  const fetchLeadsCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      if (!isAllData && fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }
      const response = await fetch(`/api/corporate/leadgen/leads-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          searched: data.data.searched || { total: '-', startup: '-' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch leads count:', error);
    }
  };

  const fetchContactsCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/contacts-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          contacts: data.data.contacts || { total: '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch contacts count:', error);
    }
  };

  const fetchNormalLeadsCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      if (!isAllData && fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }
      const response = await fetch(`/api/corporate/leadgen/normal-leads-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          normal: { leads: data.data.leads?.total || '-', calls: prev.normal?.calls || '-' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch normal leads count:', error);
    }
  };

  const fetchNormalCallsCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      // Determine dateRange: 'all' if isAllData, 'specific' if date range selected, 'default' otherwise
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/normal-calls-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          normal: { leads: prev.normal?.leads || '-', calls: data.data.calls?.total || '-' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch normal calls count:', error);
    }
  };

  const fetchCallsCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      // Determine dateRange: 'all' if isAllData, 'specific' if date range selected, 'default' otherwise
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      // Fetch regular calls, startup calls, and master union calls in parallel
      const [callsResponse, startupCallsResponse, masterUnionCallsResponse] = await Promise.all([
        fetch(`/api/corporate/leadgen/calls-type-count?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/corporate/leadgen/startup-calls?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/corporate/leadgen/master-union-calls?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);
      
      const callsData = await callsResponse.json();
      const startupCallsData = await startupCallsResponse.json();
      const masterUnionCallsData = await masterUnionCallsResponse.json();
      
      if (callsData.success && callsData.data) {
        setKpiData(prev => ({
          ...prev,
          calls: { 
            ...prev.calls, 
            total: callsData.data.calls?.total || '0', 
            new: { total: callsData.data.newCalls?.total || '0', startup: startupCallsData.data?.newCalls?.total || '0' },
            followup: { total: callsData.data.followupCalls?.total || '0', startup: startupCallsData.data?.followupCalls?.total || '0' },
            startup: startupCallsData.data?.calls?.total || '0'
          },
          masterUnion: {
            ...prev.masterUnion,
            calling: masterUnionCallsData.data?.calls?.total || '0'
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch calls count:', error);
    }
  };

  const notPickedTotal = '-';
  const fetchNotPickedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/not-picked-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          notPicked: { total: data.data.notPicked?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch not picked count:', error);
    }
  };

  const fetchPickedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/picked-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          picked: { total: data.data.picked?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch picked count:', error);
    }
  };

  const fetchSentToManagerCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/sent-to-manager-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          sentToManager: { total: data.data.sentToManager?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch sent to manager count:', error);
    }
  };

  const fetchInterestedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/interested-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          interested: { total: data.data.interested?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch interested count:', error);
    }
  };

  const fetchOnboardCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/onboard-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          onboarded: { total: data.data.onboard?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch onboard count:', error);
    }
  };

  const fetchContractCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/contract-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          contract: { total: data.data.contract?.total || '0', startup: '0' }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch contract count:', error);
    }
  };

  const fetchFranchiseDiscussedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/franchise-discussed?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          franchise: { ...prev.franchise, discussed: { total: data.data.franchise?.total || '0', startup: '0' } }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch franchise discussed count:', error);
    }
  };

  const fetchFranchiseFormAskCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      params.append('status', 'application form share');
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/franchise-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          franchise: { ...prev.franchise, formAsk: { total: data.data.franchise?.total || '0', startup: '0' } }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch franchise form ask count:', error);
    }
  };

  const fetchFranchiseFormSharedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      params.append('status', 'application form share');
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/franchise-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          franchise: { ...prev.franchise, formShared: { total: data.data.franchise?.total || '0', startup: '0' } }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch franchise form shared count:', error);
    }
  };

  const fetchFranchiseAcceptedCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/franchise-accepted?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          franchise: { ...prev.franchise, accepted: { total: data.data.franchiseAccepted?.total || '0', startup: '0' } }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch franchise accepted count:', error);
    }
  };

  // Remove unused variables
  // const normalSearched = '-';
  // const normalCalls = '-';

  const wrapperRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const fetchLatestInteractionDate = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/leadgen/latest-interaction-date', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.latestDate) {
        setLatestInteractionDate(data.latestDate);
        setFromDate(data.latestDate);
        setToDate(data.latestDate);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setLatestInteractionDate(today);
        setFromDate(today);
        setToDate(today);
      }
    } catch (error) {
      console.error('Failed to fetch latest interaction date:', error);
      const today = new Date().toISOString().split('T')[0];
      setLatestInteractionDate(today);
      setFromDate(today);
      setToDate(today);
    }
  };

  const fetchMasterUnionCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const params = new URLSearchParams();
      
      // Determine dateRange: 'all' if isAllData, 'specific' if date range selected, 'default' otherwise
      if (isAllData) {
        params.append('dateRange', 'all');
      } else if (fromDate && toDate) {
        params.append('dateRange', 'specific');
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('dateRange', 'default');
      }
      
      const response = await fetch(`/api/corporate/leadgen/master-union-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setKpiData(prev => ({
          ...prev,
          masterUnion: { 
            ...prev.masterUnion, 
            company: data.data.masterUnion?.total || '0'
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch master union count:', error);
    }
  };

  useEffect(() => {
      fetchLatestInteractionDate();
      fetchTodayFollowUps();
  }, []);

  // Fetch counts after latest date is set
  useEffect(() => {
    if (latestInteractionDate) {
      fetchLeadsCount();
      fetchContactsCount();
      fetchNormalLeadsCount();
      fetchNormalCallsCount();
      fetchCallsCount();
      fetchNotPickedCount();
      fetchPickedCount();
      fetchSentToManagerCount();
      fetchInterestedCount();
      fetchOnboardCount();
      fetchMasterUnionCount();
      fetchConversationLog();
    }
  }, [latestInteractionDate]);

  // Fetch data when isAllData changes
  useEffect(() => {
    if (!latestInteractionDate) return;
    fetchLeadsCount();
    fetchContactsCount();
    fetchNormalLeadsCount();
    fetchNormalCallsCount();
    fetchCallsCount();
    fetchNotPickedCount();
    fetchPickedCount();
    fetchSentToManagerCount();
    fetchInterestedCount();
    fetchOnboardCount();
    fetchContractCount();
      fetchFranchiseDiscussedCount();
    fetchFranchiseFormAskCount();
    fetchFranchiseFormSharedCount();
    fetchFranchiseAcceptedCount();
    fetchConversationLog();
  }, [isAllData]);

  // Refetch data when date range changes (after initial date is fetched)
  useEffect(() => {
    // Skip the first run (initial load), only fetch on subsequent date changes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (fromDate && toDate) {
      fetchLeadsCount();
      fetchContactsCount();
      fetchNormalLeadsCount();
      fetchNormalCallsCount();
      fetchCallsCount();
      fetchNotPickedCount();
      fetchPickedCount();
      fetchSentToManagerCount();
      fetchInterestedCount();
      fetchOnboardCount();
      fetchContractCount();
      fetchFranchiseDiscussedCount();
      fetchFranchiseFormAskCount();
      fetchFranchiseFormSharedCount();
      fetchFranchiseAcceptedCount();
      fetchMasterUnionCount();
      fetchConversationLog();
    }
  }, [fromDate, toDate]);

  const getYears = () => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getWeeks = () => {
    const weeks = [];
    const targetDate = new Date(fromDate || new Date());
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    let currentDate = new Date(year, month, 1);
    let weekCount = 1;

    while (currentDate.getMonth() === month) {
        let start = new Date(currentDate);
        let dayOfWeek = currentDate.getDay();
        let daysToSaturday = 6 - dayOfWeek; 
        let end = new Date(currentDate);
        end.setDate(end.getDate() + daysToSaturday);

        if (end.getMonth() !== month) {
           end = new Date(year, month + 1, 0);
        }

        weeks.push({
          label: `Week ${weekCount}`,
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        });

        currentDate = new Date(end);
        currentDate.setDate(currentDate.getDate() + 1);
        weekCount++;
    }
    return weeks;
  };

  const handleDateSelection = (type, value) => {
    const today = new Date();
    let start, end;

    if (type === 'Year') {
        start = `${value}-01-01`;
        end = `${value}-12-31`;
        setSelectedLabel(`Year: ${value}`);
        setIsAllData(false);
    } else if (type === 'Month') {
        start = new Date(today.getFullYear(), value, 1).toISOString().split('T')[0];
        end = new Date(today.getFullYear(), value + 1, 0).toISOString().split('T')[0];
        const monthName = new Date(today.getFullYear(), value).toLocaleString('default', { month: 'long' });
        setSelectedLabel(`Month: ${monthName}`);
        setIsAllData(false);
    } else if (type === 'Week') {
        start = value.start;
        end = value.end;
        setSelectedLabel(value.label);
        setIsAllData(false);
    } else if (type === 'All') {
        start = '2024-01-01';
        end = new Date().toISOString().split('T')[0];
        setSelectedLabel('All Data');
        setIsAllData(true);
    }

    setFromDate(start);
    setToDate(end);
    setActiveDropdown(null);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Calibri'] text-slate-800">
      
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        
        <div className="bg-white px-6 py-2 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic">Lead Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4" ref={wrapperRef}>
            {latestInteractionDate && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock size={12} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-700">Latest Date : {latestInteractionDate}</span>
              </div>
            )}
              
              <div className="flex bg-gray-100 p-1 rounded-lg relative">
                  <button onClick={() => handleDateSelection('All')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${selectedLabel === 'All Data' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Year') || activeDropdown === 'year' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Year <ChevronDown size={10}/></button>
                      {activeDropdown === 'year' && (
                          <div className="absolute top-full left-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getYears().map(year => <button key={year} onClick={() => handleDateSelection('Year', year)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{year}</button>)}
                          </div>
                      )}
                  </div>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'month' ? null : 'month')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Month') || activeDropdown === 'month' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Month <ChevronDown size={10}/></button>
                      {activeDropdown === 'month' && (
                          <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 max-h-60 overflow-y-auto custom-scrollbar">
                              {Array.from({length: 12}).map((_, i) => <button key={i} onClick={() => handleDateSelection('Month', i)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{new Date(0, i).toLocaleString('default', { month: 'long' })}</button>)}
                          </div>
                      )}
                  </div>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'week' ? null : 'week')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Week') || activeDropdown === 'week' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Week <ChevronDown size={10}/></button>
                      {activeDropdown === 'week' && (
                          <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getWeeks().map((week, idx) => <button key={idx} onClick={() => handleDateSelection('Week', week)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{week.label}</button>)}
                          </div>
                      )}
                  </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                 <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
                 <span className="text-gray-300">-</span>
                 <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
              </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-6">
          {/* ROW 1: OVERALL */}
          <div>
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Database size={14} /> 1. Overall Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Total Leads" total={kpiData.searched.total} icon={<SearchIcon/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Total Contacts" total={kpiData.contacts.total} icon={<UserCheck size={18}/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'contacts' })} />
              <KpiCard title="Total Calls" total={kpiData.calls.total} icon={<Phone size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'calls' })} />
              <KpiCard title="New Calls" total={kpiData.calls.new.total} icon={<PhoneOutgoing size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'new_calls' })} />
              <KpiCard title="Followup Calls" total={kpiData.calls.followup.total} icon={<PhoneIncoming size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'followup_calls' })} />
              <KpiCard title="Picked" total={kpiData.picked.total} icon={<CheckCircle size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'picked' })} />
              <KpiCard title="Not Picked" total={kpiData.notPicked.total} icon={<PhoneMissed size={18}/>} color="red" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'not_picked' })} />
              <KpiCard title="Contract Share" total={kpiData.contract.total} icon={<FileText size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'contract' })} />
              <KpiCard title="Interested" total={kpiData.interested.total} icon={<TrendingUp size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'interested' })} />
              <KpiCard title="Sent to Manager" total={kpiData.sentToManager.total} icon={<Send size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'sent_to_manager' })} />
              <KpiCard title="Total Onboard" total={kpiData.onboarded.total} icon={<Briefcase size={18}/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'onboard' })} />
            </div>
          </div>

          {/* ROW 2: NORMAL */}
          <div>
            <h4 className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><UserCheck size={14} /> 2. Normal Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={kpiData.normal.leads} icon={<SearchIcon/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'No' })} />
              <KpiCard title="Calls" total={kpiData.normal.calls} icon={<Phone size={18}/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'No', cardType: 'normal_calls' })} />
            </div>
          </div>

          {/* ROW 3: STARTUP (KEPT THESE CARDS) */}
          <div>
            <h4 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Rocket size={14} /> 3. Startup Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={kpiData.searched.startup} icon={<SearchIcon/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
              <KpiCard title="Calls" total={kpiData.calls.startup} icon={<Phone size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
            </div>
          </div>

          {/* ROW 4: MASTER UNION */}
          <div>
            <h4 className="text-xs font-black text-purple-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Briefcase size={14} /> 4. Master Union Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={kpiData.masterUnion.company} icon={<Briefcase size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
              <KpiCard title="Profiles" total={kpiData.masterUnion.profiles} icon={<UserCheck size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
              <KpiCard title="Calls" total={kpiData.masterUnion.calling} icon={<Phone size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union', cardType: 'master_union_calls' })} />
            </div>
          </div>

          {/* ROW 5: FRANCHISE */}
          <div>
            <h4 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Award size={14} /> 5. Franchise Pipeline</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Franchise Discussed" total={kpiData.franchise.discussed.total} icon={<Phone size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_discussed' })} />
              <KpiCard title="Form Ask" total={kpiData.franchise.formAsk.total} icon={<FileText size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_form_ask' })} />
              <KpiCard title="Form Shared" total={kpiData.franchise.formShared.total} icon={<Send size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_form_shared' })} />
              <KpiCard title="Franchise Accepted" total={kpiData.franchise.accepted.total} icon={<CheckCircle size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_accepted' })} />
            </div>
          </div>

        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10 shrink-0">
        <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#103c7f] flex items-center gap-2 tracking-tight uppercase italic"><Clock size={18} className="text-orange-500" /> Follow-up Schedule <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded ml-2">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</span></h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {followUps.map((item) => (
                <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all group relative">
                  <div className="pl-2.5">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1 mb-1.5">{item.company}</h4>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="p-1 bg-gray-100 rounded-full text-gray-500"><UserCheck size={10} /></div>
                        <span className="text-xs font-bold text-slate-700">{item.contact_person}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 mb-3">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 flex items-center gap-1"><FileText size={10}/> Last Discussion</p>
                        <p className="text-xs text-slate-600 italic leading-snug">"{item.remarks}"</p>
                      </div>
                      <button onClick={() => router.push(`/corporate/leadgen/leads?search=${encodeURIComponent(item.company)}`)} className="w-full bg-blue-50 border border-blue-100 text-[#103c7f] text-[10px] font-bold py-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-colors flex items-center justify-center gap-1.5"><Phone size={12} className="fill-current"/> Call Now</button>
                  </div>
                </div>
            ))}
        </div>
        <div className="p-4 border-t border-gray-100 mt-auto bg-white">
          <Link href="/corporate/leadgen/leads"><button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"><Database size={16} /> Open Full Database</button></Link>
        </div>
      </div>
    </div>
  );
}

// --- UPDATED KPI CARD: NO STRIP ---
function KpiCard({ title, total, icon, color, onClick }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        green: "bg-green-50 text-green-700 border-green-100",
        red: "bg-red-50 text-red-700 border-red-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        teal: "bg-teal-50 text-teal-700 border-teal-100",
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div 
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full cursor-pointer"
          onClick={onClick}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-slate-800 leading-none ml-1">{total}</h3>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}
