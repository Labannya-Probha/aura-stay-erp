import { useEffect, useMemo, useState } from "react"
import { Boxes, RefreshCw } from "lucide-react"

import EnterpriseWorkspace from "../../components/layout/EnterpriseWorkspace"
import ModuleTabs from "../../components/layout/ModuleTabs"
import KpiStrip from "../../components/layout/KpiStrip"
import { Button } from "../../components/ui/button"

import { supabase } from "../../supabase"
import { runSingleFlight } from "../../lib/singleFlight"
import { useInventoryTabs } from "./hooks/useInventoryTabs"
import { INVENTORY_TABS } from "./inventory.config"

import StockOverviewTab from "./tabs/StockOverviewTab"
import VendorsTab from "./tabs/VendorsTab"
import RequisitionsTab from "./tabs/RequisitionsTab"
import PurchaseOrdersTab from "./tabs/PurchaseOrdersTab"
import GoodsReceiptTab from "./tabs/GoodsReceiptTab"
import TransfersTab from "./tabs/TransfersTab"
import ReturnsTab from "./tabs/ReturnsTab"
import ConsumptionEntryTab from "./tabs/ConsumptionEntryTab"

export default function InventoryPage({
  userName,
  role,
  isAdmin,
}) {
  const { activeTab, setActiveTab } = useInventoryTabs()
  const [kpiItems, setKpiItems] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadKpis = async () => {
      setRefreshing(true)

      try {
        const [itemsRes, vendorsRes, reqRes, poRes] =
          await runSingleFlight(`inventory:kpis:${refreshKey}`, () => Promise.all([
            supabase
              .from("inv_items")
              .select("id", { head: true, count: "exact" }),
            supabase
              .from("vendors")
              .select("id", { head: true, count: "exact" }),
            supabase
              .from("requisitions")
              .select("id", { head: true, count: "exact" }),
            supabase
              .from("purchase_orders")
              .select("id", { head: true, count: "exact" }),
          ]))

        const error =
          itemsRes.error ||
          vendorsRes.error ||
          reqRes.error ||
          poRes.error

        if (error) throw error
        if (ignore) return

        setKpiItems([
          {
            label: "Items",
            value: itemsRes.count ?? 0,
          },
          {
            label: "Vendors",
            value: vendorsRes.count ?? 0,
          },
          {
            label: "Requisitions",
            value: reqRes.count ?? 0,
          },
          {
            label: "Purchase Orders",
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

    if (activeTab === "vendors") {
      return <VendorsTab {...shared} />
    }

    if (activeTab === "requisitions") {
      return <RequisitionsTab {...shared} />
    }

    if (activeTab === "purchase-orders") {
      return <PurchaseOrdersTab {...shared} />
    }

    if (activeTab === "goods-receipt") {
      return <GoodsReceiptTab {...shared} />
    }

    if (activeTab === "transfers") {
      return <TransfersTab {...shared} />
    }

    if (activeTab === "returns") {
      return <ReturnsTab {...shared} />
    }

    if (activeTab === "consumption") {
      return (
        <ConsumptionEntryTab
          userName={userName}
          isAdmin={isAdmin}
        />
      )
    }

    return <StockOverviewTab {...shared} />
  }, [
    activeTab,
    isAdmin,
    role,
    setActiveTab,
    userName,
  ])

  return (
    <EnterpriseWorkspace
      title="Inventory & Procurement Workspace"
      subtitle="Requisition, purchase order, goods receipt, stock movement, consumption and vendor control."
      eyebrow="Supply Chain & Stores"
      icon={Boxes}
      actions={
        <Button
          variant="outline"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      }
      kpis={<KpiStrip items={kpiItems} />}
      tabs={
        <ModuleTabs
          tabs={INVENTORY_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      <div
        id={`module-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${activeTab}`}
      >
        {tabContent}
      </div>
    </EnterpriseWorkspace>
  )
}
