import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../supabase';
import { fmtBDT, todayISO } from '../lib/helpers';
import { BarChart3, ArrowLeft, RefreshCw, AlertCircle, LayoutDashboard, Activity, Landmark, TrendingUp } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   1. REPORT MODULE DEFINITIONS (Multi-tenant ready)
══════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'KPI Overview', icon: LayoutDashboard, group: 'Overview' },
  { id: 'receipt_payment', label: 'Receipt & Payment', desc: 'Cash/Bank Summary', icon: Activity, group: 'Accounting' },
  { id: 'pl', label: 'Profit & Loss', desc: 'Income Statement', icon: Landmark, group: 'Accounting' },
  { id: 'sales', label: 'Sales Reports', desc: 'Sales breakdown', icon: TrendingUp, group: 'Operations' },
];

/* ══════════════════════════════════════════════════════════════════════
   2. RECEIPT & PAYMENT SUB-COMPONENT
══════════════════════════════════════════════════════════════════════ */
const ReceiptPaymentStatement = ({ tenantId }) => {
  const [data, setData] = useState({ receipts: [], payments: [] });
  const [loading, setLoading] = useState(false);

  const fetchRnP = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const from = todayISO().slice(0, 8) + '01';
    
    // Multi-tenant Query - Row Level Security (RLS) ensures data isolation
    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', from);

    if (txns) {
      setData({
        receipts: txns.filter(t => t.type === 'RECEIPT'),
        payments: txns.filter(t => t.type === 'PAYMENT')
      });
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchRnP(); }, [fetchRnP]);

  if (loading) return <div className="p-10 text-center"><RefreshCw className="animate-spin inline" /> Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 border-b">
          <tr><th className="p-3 text-left">Particulars</th><th className="p-3 text-right">Amount</th></tr>
        </thead>
        <tbody>
          {data.receipts.map((r, i) => (
            <tr key={i} className="border-b"><td className="p-3 truncate max-w-[200px]">{r.ref}</td><td className="p-3 text-right">{fmtBDT(r.amount)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   3. MAIN REPORTS HUB
══════════════════════════════════════════════════════════════════════ */
export default function ReportsHub({ tenantId }) {
  const [activeTab, setActiveTab] = useState(null);

  if (!tenantId) {
    return <div className="p-10 text-red-600 bg-red-50 border border-red-200 rounded-lg">Error: No Tenant ID provided. Multi-tenant access denied.</div>;
  }

  return (
    <div className="w-full p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Reports Hub</h1>
        {activeTab && (
          <button onClick={() => setActiveTab(null)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-slate-100">
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      {!activeTab ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TABS.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)} 
              className="p-6 bg-white border rounded-xl hover:border-blue-500 shadow-sm cursor-pointer transition">
              <t.icon className="text-blue-500 mb-3" size={24} />
              <h3 className="font-bold truncate">{t.label}</h3>
              <p className="text-xs text-slate-500 mt-1 truncate">{t.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          {activeTab === 'receipt_payment' && <ReceiptPaymentStatement tenantId={tenantId} />}
          {activeTab === 'dashboard' && <div className="text-center p-10">Dashboard Content...</div>}
        </div>
      )}
    </div>
  );
}
