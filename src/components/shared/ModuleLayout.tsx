import type { ComponentProps } from 'react'
import ModuleContainer from 'src/components/shared/ModuleContainer'

type ModuleLayoutProps = ComponentProps<typeof ModuleContainer>

export default function ModuleLayout(props: ModuleLayoutProps) {
  return <ModuleContainer {...props} />
}
