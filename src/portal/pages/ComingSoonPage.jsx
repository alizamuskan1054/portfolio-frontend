import { Hammer } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

// Jin portal pages ka kaam abhi baaki hai (agle phases).
export function PortalComingSoonPage({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Hammer}
        title="Coming soon"
        description="This page is being built and will be available shortly."
      />
    </>
  )
}
