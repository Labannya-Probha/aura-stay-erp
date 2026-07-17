import { AedsFilterEngine } from "../../../components/filter-engine"

const schema = [
  {
    name: "department",
    label: "Department",
    type: "select",
    options: ["Accounts", "Inventory", "Restaurant", "Housekeeping", "Sales"],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Posted", "Draft", "Pending", "Approved", "Cancelled"],
  },
  {
    name: "room_type",
    label: "Room Type",
    type: "select",
    options: ["Deluxe", "Suite", "Family", "Premium"],
  },
  {
    name: "guest",
    label: "Guest / Party",
    placeholder: "Search guest, vendor or company",
  },
]

export default function ReportFilterV5Demo() {
  return (
    <AedsFilterEngine
      schema={schema}
      initialValues={{ cycle: "this_month", status: "Posted" }}
      onChange={(values) => console.log("FILTER VALUES", values)}
      storageKey="aeds.reports.filters"
    />
  )
}
