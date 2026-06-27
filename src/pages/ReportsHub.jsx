import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../supabase';
import { fmtBDT, todayISO } from '../lib/helpers';
import { BarChart3, ArrowLeft, RefreshCw, AlertCircle, FileDown, Printer, FolderOpen, Filter, Activity } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   1. ENTERPRISE CONFIG & TAB DEFINITIONS
══════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { id: 'receipt_payment', label: 'Receipt & Payment', group: 'Accounting' },
  { id: 'pl', label: 'Profit & Loss', group: 'Accounting' },
  { id: 'sales', label: 'Sales Reports', group: 'Operations' }
];

const GROUPS = ['All', 'Overview', 'Operations', 'Accounting'];

/* ══════════════════════════════════════════════════════════════════════
   2. SUB-COMPONENTS (Report Modules)
══════════════════════════════════════════════════════════════════════ */

// Receipt & Payment Report (Enterprise Logic)
const ReceiptPaymentStatement = ({ tenantId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRnP = useCallback(async () => {
    setLoading(true);
    const from = todayISO().slice(0, 8) + '01';
    
    // Multi-tenant Query
    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', from);

    // Logic for Statement Calculation
    if (txns) {
      const receipts = txns.filter(t => t.type === 'RECEIPT');
      const payments = txns.filter(t => t.type === 'PAYMENT');
      setData({ receipts, payments });
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchRnP(); }, [fetchRnP]);

  if (loading) return <div className="p-10 text-center"><RefreshCw className="animate-spin inline" /> Loading...</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-600">
          <tr><th className="p-3">Receipts</th><th className="p-3 text-right">Amount</th></tr>
        </thead>
        <tbody>
          {data?.receipts.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="p-3">{r.ref || 'Generic Receipt'}</td>
              <td className="p-3 text-right">{fmtBDT(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   3. MAIN REPORT HUB COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function ReportsHub({ tenantId }) {
  const [activeTab, setActiveTab] = useState(null);
  const [activeGroup, setActiveGroup] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTabs = useMemo(() => {
    return TABS.filter(t => 
      (activeGroup === 'All' || t.group === activeGroup) && 
      (t.label.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeGroup, search]);

  if (!tenantId) return <div className="p-10 text-red-500">Error: No Tenant Found!</div>;

  return (
    <div className="p-6 w-full min-h-screen bg-slate-50">
      {/* HEADER & SEARCH */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports Center</h1>
        {activeTab && (
          <button onClick={() => setActiveTab(null)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow-sm">
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      {/* RENDER DYNAMIC CONTENT */}
      {!activeTab ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {filteredTabs.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)} 
              className="p-5 bg-white border rounded-xl hover:shadow-lg cursor-pointer transition">
              <h3 className="font-bold">{t.label}</h3>
              <p className="text-xs text-slate-500">{t.group}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          {activeTab === 'receipt_payment' && <ReceiptPaymentStatement tenantId={tenantId} />}
          {/* Oynno report gulo ekhane add koren */}
        </div>
      )}
    </div>
  );
}
