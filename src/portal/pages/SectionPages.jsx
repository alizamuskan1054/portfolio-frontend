// Academic, Content, Contact aur Visibility pages: admin wizard ke wahi components, bas apne frame mein.

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { portfoliosResource } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ContactLinks } from '@/admin/pages/ContactLinks'
import { SectionTabs } from '@/admin/pages/PortfolioSections'
import { VisibilityEditor } from '@/features/portfolio/PortfolioFields'
import { notify } from '@/lib/notify'
import { normalizeVisibility } from '@/lib/visibility'
import { usePortfolio } from '@/portal/usePortfolio'

export function AcademicPage() {
  const { portfolio } = usePortfolio()
  return (
    <Card>
      <CardHeader
        title="Academic"
        description="Education, experience, research interests, expertise, awards and memberships. Changes save instantly."
      />
      <CardContent className="space-y-5">
        <SectionTabs group="academic" portfolioId={portfolio.id} />
      </CardContent>
    </Card>
  )
}

export function ContentPage() {
  const { portfolio } = usePortfolio()
  return (
    <Card>
      <CardHeader
        title="Website content"
        description="Projects, blogs, services, publications, testimonials and more. Changes save instantly."
      />
      <CardContent className="space-y-5">
        <SectionTabs
          group="content"
          portfolioId={portfolio.id}
          exclude={['contact-links']}
        />
      </CardContent>
    </Card>
  )
}

export function ContactPage() {
  const { portfolio } = usePortfolio()
  return <ContactLinks portfolioId={portfolio.id} />
}

export function VisibilityPage() {
  const { portfolio } = usePortfolio()
  const queryClient = useQueryClient()
  const initial = normalizeVisibility(portfolio.section_visibility)
  const [value, setValue] = useState(initial)
  const [dirty, setDirty] = useState(false)

  const save = useMutation({
    mutationFn: () =>
      portfoliosResource.update(portfolio.id, { section_visibility: value }),
    onSuccess: async (result) => {
      queryClient.setQueryData(
        portfoliosResource.keys.detail(String(portfolio.id)),
        result,
      )
      await queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all })
      setDirty(false)
      notify.success('Visibility saved.')
    },
    onError: (e) => notify.error(e),
  })

  return (
    <div className="space-y-6">
      <VisibilityEditor
        value={value}
        onChange={(next) => {
          setValue(next)
          setDirty(true)
        }}
      />
      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>
          Save visibility
        </Button>
      </div>
    </div>
  )
}
