/* ------------------------------------------------------------------ */
/*  SETTINGS PAGE                                                       */
/*  Role-gated settings hub; sections are toggled via accordion.        */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ModuleLayout from '../../components/shared/ModuleLayout'
import EmptyState from '../../components/feedback/EmptyState'
import PermissionDebugStrip from '../../components/debug/PermissionDebugStrip'
import AdminFeatureAccessCard from '../../components/settings/AdminFeatureAccessCard'
import ReservationPolicyCard from '../../components/settings/ReservationPolicyCard'
import {
  SETTINGS_SECTIONS,
  getVisibleSettingsSections,
} from '../../app/navigation/settingsSections'
import { useSettingsSection } from '../../hooks/useSettingsSection'
import { SECTION_ICONS } from './settings.config'
import { CollapsibleSection } from './settings.helpers'
import MyAccountSection from './sections/MyAccountSection'
import CompanySection from './sections/CompanySection'
import BrandingSection from './sections/BrandingSection'
import PosPrintSection from './sections/PosPrintSection'
import TaxPolicySection from './sections/TaxPolicySection'
import AccountingSetupSection from './sections/AccountingSetupSection'
import RolesPermissionsSection from './sections/RolesPermissionsSection'
import UsersStaffSection from './sections/UsersStaffSection'
import SystemDataSection from './sections/SystemDataSection'
import { isUiDebugEnabled, recordPermissionHidden } from '../../debug/uiDebug'

export default function Settings({ userName, role, isAdmin, reloadCompany }) {
  const isSuperuser = role === 'SUPERUSER'
  const isAdminPlus = isSuperuser || isAdmin
  const canManage = isAdminPlus || role === 'MANAGER'

  const [myTenantId, setMyTenantId] = useState(null)
  const [tenantLoading, setTenantLoading] = useState(true)
  const [tenantError, setTenantError] = useState(null)
  useEffect(() => {
    let active = true

    setTenantLoading(true)
    setTenantError(null)

    supabase.auth.getUser().then(({ data: u }) => {
      if (!u?.user?.id) {
        if (!active) return
        setTenantLoading(false)
        return
      }
      supabase
        .from('app_users')
        .select('tenant_id')
        .eq('id', u.user.id)
        .single()
        .then(({ data, error }) => {
          if (!active) return
          if (error) {
            setTenantError(error.message)
            setTenantLoading(false)
            return
          }
          if (data?.tenant_id) setMyTenantId(data.tenant_id)
          setTenantLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [])

  const sectionContents = useMemo(
    () => ({
      'my-account': <MyAccountSection userName={userName} />,
      'saas-admin': <CompanySection />,
      branding: <BrandingSection reloadCompany={reloadCompany} />,
      'pos-print': <PosPrintSection tenantId={myTenantId} />,
      'tax-policy': <TaxPolicySection tenantId={myTenantId} isAdmin={isAdminPlus} />,
      allowance: <AccountingSetupSection />,
      'role-permissions': <RolesPermissionsSection />,
      'admin-feature-access': <AdminFeatureAccessCard />,
      staff: (
        <UsersStaffSection
          isAdminPlus={isAdminPlus}
          isSuperuser={isSuperuser}
          userName={userName}
        />
      ),
      'reservation-policy': <ReservationPolicyCard />,
      'data-system': <SystemDataSection />,
    }),
    [isAdminPlus, isSuperuser, myTenantId, reloadCompany, userName],
  )

  const visibleSections = useMemo(
    () => getVisibleSettingsSections({ role, isAdmin }),
    [role, isAdmin],
  )
  const hiddenSections = useMemo(
    () =>
      SETTINGS_SECTIONS.filter(
        (section) => !visibleSections.some((visible) => visible.id === section.id),
      ),
    [visibleSections],
  )

  useEffect(() => {
    if (!isUiDebugEnabled() || hiddenSections.length === 0) return

    hiddenSections.forEach((section) => {
      recordPermissionHidden({
        moduleId: 'settings',
        label: section.label,
        reason: section.superuserOnly
          ? 'superuser-only section'
          : section.adminOnly
            ? 'admin-only section'
            : 'hidden by settings policy',
      })
    })
  }, [hiddenSections])

  const sections = visibleSections.map((section) => ({
    ...section,
    title: section.label,
    icon: SECTION_ICONS[section.id],
    content: sectionContents[section.id],
  }))

  const { activeSection, openSection } = useSettingsSection(sections)

  if (!canManage) {
    return (
      <EmptyState
        variant="container"
        title="Access restricted"
        description="Settings can only be accessed by managers or administrators."
        icon={ShieldCheck}
        className="max-w-xl"
      />
    )
  }

  return (
    <ModuleLayout
      moduleName="settings"
      routeKey="settings"
      title="Settings"
      description="Branding, tax rates, staff and system configuration."
      icon={ShieldCheck}
      loading={tenantLoading}
      error={tenantError}
      empty={!tenantLoading && sections.length === 0}
      emptyTitle="No settings sections available"
      emptyDescription="This role currently does not expose any settings sections."
      kpis={
        <PermissionDebugStrip
          label="Settings visibility debug"
          visibleCount={sections.length}
          hiddenCount={hiddenSections.length}
          visibleLabel="sections visible"
          hiddenLabel="sections hidden"
          detail={isUiDebugEnabled() ? `tenant: ${myTenantId || 'loading'}` : undefined}
        />
      }
    >
      <div className="space-y-4">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.id}
            title={section.title}
            icon={section.icon}
            open={activeSection === section.id}
            onToggle={() => openSection(section.id)}
          >
            {section.content}
          </CollapsibleSection>
        ))}
      </div>
    </ModuleLayout>
  )
}
