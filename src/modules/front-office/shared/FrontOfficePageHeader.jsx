import ModulePageHeader from 'src/components/shared/ModulePageHeader'

export default function FrontOfficePageHeader({ page, onRefresh, refreshing = false, actions }) {
  return (
    <ModulePageHeader
      title={page?.title || 'Front Office'}
      description={page?.description}
      icon={page?.icon || null}
      actions={actions}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  )
}
