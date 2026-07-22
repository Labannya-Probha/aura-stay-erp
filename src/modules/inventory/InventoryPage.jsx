import { useEffect, useMemo, useState } from 'react'
import { Boxes, RefreshCw } from 'lucide-react'

import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleTabs from '../../components/layout/ModuleTabs'
import KpiStrip from '../../components/layout/KpiStrip'
import { Button } from '../../components/ui/button'
import ModuleLayout from 'src/components/shared/ModuleLayout'

import { supabase } from '../../lib/supabase'
import { useInventoryTabs } from './hooks/useInventoryTabs'
import { INVENTORY_TABS } from './inventory.config'

import StockOverviewTab from './tabs/StockOverviewTab'
import VendorsTab from './tabs/VendorsTab'
import RequisitionsTab from './tabs/RequisitionsTab'
import PurchaseOrdersTab from './tabs/PurchaseOrdersTab'
import GoodsReceiptTab from './tabs/GoodsReceiptTab'
import TransfersTab from './tabs/TransfersTab'
import ReturnsTab from './tabs/ReturnsTab'
import ConsumptionEntryTab from './tabs/ConsumptionEntryTab'

export default function InventoryPage({ userName, role, isAdmin }) {
  const { activeTab, setActiveTab } = useInventoryTabs()
  const [kpiItems, setKpiItems] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [navReq, setNavReq] = useState(null)

  const canApprove = isAdmin || role === 'MANAGER'

  const flash = (text, type = 'ok') => {
    setMsg({ text, type })
    window.setTimeout(() => setMsg(null), 5000)
  }

  const goCreatePO = (req) => {
    setNavReq({ ...req, type: 'PO' })
    setActiveTab('purchase-orders')
  }

  const goCreateTRF = (req) => {
    setNavReq({ ...req, type: 'TRF' })
    setActiveTab('transfers')
  }

  useEffect(() => {
    let ignore = false

    const loadKpis = async () => {
      setRefreshing(true)

      try {
        const [itemsRes, vendorsRes, reqRes, poRes] = await Promise.all([
          supabase.from('inv_items').select('id', { head: true, count: 'exact' }),
          supabase.from('vendors').select('id', { head: true, count: 'exact' }),
          supabase.from('requisitions').select('id', { head: true, count: 'exact' }),
          supabase.from('purchase_orders').select('id', { head: true, count: 'exact' }),
        ])

        const error = itemsRes.error || vendorsRes.error || reqRes.error || poRes.error

        if (error) throw error
        if (ignore) return

        setKpiItems([
          {
            label: 'Items',
            value: itemsRes.count ?? 0,
          },
          {
            label: 'Vendors',
            value: vendorsRes.count ?? 0,
          },
          {
            label: 'Requisitions',
            value: reqRes.count ?? 0,
          },
          {
            label: 'Purchase Orders',
            value: poRes.count ?? 0,
          },
        ])
      } catch {
        if (!ignore) setKpiItems([])
      } finally {
        if (!ignore) setRefreshing(false)
      }
    }

    loadKpis()

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const tabContent = useMemo(() => {
    const shared = {
      userName,
      role,
      isAdmin,
      onTabChange: setActiveTab,
    }

    if (activeTab === 'vendors') {
      return <VendorsTab {...shared} />
    }

    if (activeTab === 'requisitions') {
      return (
        <RequisitionsTab
          flash={flash}
          userName={userName}
          canApprove={canApprove}
          onCreatePO={goCreatePO}
          onCreateTRF={goCreateTRF}
        />
      )
    }

    if (activeTab === 'purchase-orders') {
      return (
        <PurchaseOrdersTab
          flash={flash}
          userName={userName}
          canApprove={canApprove}
          navReq={navReq}
          clearNav={() => setNavReq(null)}
        />
      )
    }

    if (activeTab === 'goods-receipt') {
      return <GoodsReceiptTab flash={flash} userName={userName} />
    }

    if (activeTab === 'transfers') {
      return (
        <TransfersTab
          flash={flash}
          userName={userName}
          navReq={navReq}
          clearNav={() => setNavReq(null)}
        />
      )
    }

    if (activeTab === 'returns') {
      return <ReturnsTab {...shared} />
    }

    if (activeTab === 'consumption') {
      return <ConsumptionEntryTab userName={userName} isAdmin={isAdmin} />
    }

    return <StockOverviewTab {...shared} />
  }, [activeTab, canApprove, flash, isAdmin, navReq, role, setActiveTab, userName])

  const breadcrumbItems = [
    { label: 'Modules' },
    { label: 'Inventory' },
    {
      label: INVENTORY_TABS.find((tabItem) => tabItem.key === activeTab)?.label || 'Overview',
      current: true,
    },
  ]

  return (
    <ModuleLayout
      moduleName="Inventory"
      routeKey="inventory-root"
      title="Inventory & Procurement Workspace"
      description="Requisition, purchase order, goods receipt, stock movement, consumption and vendor control."
      eyebrow="Supply Chain & Stores"
      icon={Boxes}
      breadcrumb={<Breadcrumb items={breadcrumbItems} />}
      actions={
        <Button
          variant="outline"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      }
      kpis={<KpiStrip items={kpiItems} />}
      tabs={<ModuleTabs tabs={INVENTORY_TABS} activeTab={activeTab} onChange={setActiveTab} />}
    >
      <div
        id={`module-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${activeTab}`}
      >
        {msg ? (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-forest/10 text-forest'}`}
          >
            {msg.text}
          </div>
        ) : null}
        {tabContent}
      </div>
    </ModuleLayout>
  )
}
