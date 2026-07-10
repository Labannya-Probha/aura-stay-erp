import { useState } from "react"
import AedsFilterBar from "./AedsFilterBar"
import AedsFilterChips from "./AedsFilterChips"
import AedsFilterDrawer from "./AedsFilterDrawer"
import AedsSavedFilters from "./AedsSavedFilters"
import { useAedsFilters } from "./useAedsFilters"
import "./aeds-filter-engine.css"

export default function AedsFilterEngine({
  schema = [],
  initialValues = { cycle: "this_month" },
  onChange,
  storageKey,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const filters = useAedsFilters({ initialValues, onChange, storageKey })
  const [recentVersion, setRecentVersion] = useState(0)

  const save = () => {
    const name = window.prompt("Filter name", "My Filter")
    if (!name) return
    filters.save(name)
    setRecentVersion((value) => value + 1)
  }

  return (
    <div className="aeds-filter-engine">
      <AedsFilterBar
        schema={schema}
        values={filters.values}
        set={filters.set}
        onOpenAdvanced={() => setDrawerOpen(true)}
        onSave={save}
      />

      <AedsFilterChips
        values={filters.values}
        clear={filters.clear}
        reset={filters.reset}
      />

      <AedsSavedFilters
        key={recentVersion}
        recent={filters.recent()}
        onLoad={filters.load}
      />

      <AedsFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        schema={schema}
        values={filters.values}
        set={filters.set}
        reset={filters.reset}
      />
    </div>
  )
}
