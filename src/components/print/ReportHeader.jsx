import React from 'react'
import { getCompanyName } from '../../theme/branding.service'

export const ReportHeader = ({ title, showNBR, company }) => {
  const companyName = getCompanyName(company) || company?.company_name || 'Company'
  const companyAddress = company?.address || ''
  const companyLogo = company?.logo_url || '/novem-logo.png'

  return (
    <div className="flex justify-between items-center border-b pb-4 mb-4">
      <div className="flex items-center gap-3">
        <img src={companyLogo} alt={`${companyName} Logo`} className="h-12 w-auto" />
        <div>
          <h1 className="text-xl font-bold">{companyName}</h1>
          {companyAddress ? <p className="text-sm">{companyAddress}</p> : null}
          {title ? <p className="text-xs text-slate-500 mt-0.5">{title}</p> : null}
        </div>
      </div>
      {showNBR && (
        <div className="text-right">
          <img src="/nbr-logo.png" alt="NBR Logo" className="h-12 w-auto ml-auto" />
          <p className="text-[10px] font-semibold">Regulatory Compliant</p>
        </div>
      )}
    </div>
  )
}
