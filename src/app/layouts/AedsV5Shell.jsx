import AedsSidebar from "../../components/aeds/AedsSidebar"
import AedsTopbar from "../../components/aeds/AedsTopbar"
import "./aeds-v5-shell.css"

export default function AedsV5Shell({ children, userName, active }) {
  return (
    <div className="aeds-v5-shell">
      <AedsSidebar active={active} />
      <div className="aeds-v5-main">
        <AedsTopbar userName={userName} />
        <main className="aeds-v5-content">{children}</main>
      </div>
    </div>
  )
}
