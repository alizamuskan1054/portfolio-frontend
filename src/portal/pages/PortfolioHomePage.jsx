import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  GlobeLock,
  Plus,
  Trash2,
} from 'lucide-react'
import { portfoliosResource } from '@/api/endpoints'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { resources, toList } from '@/admin/sections'
import { usePortfolioScope } from '@/features/portfolio/scope'
import { notify } from '@/lib/notify'
import { PORTAL_ME_KEY } from '@/portal/hooks/usePortalMe'
import { usePortfolio } from '@/portal/usePortfolio'
import { paths } from '@/routes/paths'

// Kaunse sections ke counts checklist mein dikhane hain
const COUNTED = [
  'educations',
  'experiences',
  'projects',
  'services',
  'publications',
  'contacts',
]

function DeleteModal({ portfolio, open, onClose, onConfirm, loading }) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === portfolio.slug
  const close = () => {
    setTyped('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="Delete this portfolio?"
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!matches}
            loading={loading}
          >
            Delete portfolio
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-body text-sm">
          Your public website and all its content will stop being available.
          {portfolio.status === 'published' && ' It is currently live.'} Type{' '}
          <strong className="text-heading">{portfolio.slug}</strong> to confirm.
        </p>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-label="Type the public link to confirm"
          autoComplete="off"
          placeholder={portfolio.slug}
        />
      </div>
    </Modal>
  )
}

export function PortfolioHomePage() {
  const { portfolio } = usePortfolio()
  const scope = usePortfolioScope()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const published = portfolio.status === 'published'
  const siteUrl = `${window.location.origin}${paths.site(portfolio.slug)}`
  const id = portfolio.id

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all }),
      queryClient.invalidateQueries({ queryKey: PORTAL_ME_KEY }),
    ])

  const toggle = useMutation({
    mutationFn: (action) => portfoliosResource[action](id),
    onSuccess: async (_, action) => {
      await refresh()
      setConfirmUnpublish(false)
      notify.success(
        action === 'publish' ? 'Portfolio published.' : 'Portfolio unpublished.',
      )
    },
    onError: (e) => notify.error(e),
  })

  const remove = useMutation({
    mutationFn: () => portfoliosResource.remove(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: portfoliosResource.keys.detail(String(id)) })
      await refresh()
      notify.success('Portfolio deleted.')
      navigate(paths.portalPortfolios, { replace: true })
    },
    onError: (e) => notify.error(e),
  })

  const counts = useQueries({
    queries: COUNTED.map((path) => ({
      queryKey: resources[path].keys.list({ portfolio: id }),
      queryFn: () => resources[path].list({ portfolio: id }),
    })),
  })
  const countOf = (path) => {
    const q = counts[COUNTED.indexOf(path)]
    return q.isSuccess ? toList(q.data).length : null
  }

  const basicDone = Boolean(
    portfolio.full_name && portfolio.short_intro && portfolio.profile_photo,
  )
  const checklist = [
    {
      key: 'basic',
      label: 'Basic info, intro and photo',
      done: basicDone,
      to: paths.portalPortfolioPart(id, 'basic'),
    },
    {
      key: 'educations',
      label: 'Education',
      done: countOf('educations') > 0,
      count: countOf('educations'),
      to: paths.portalPortfolioPart(id, 'academic'),
    },
    {
      key: 'experiences',
      label: 'Experience',
      done: countOf('experiences') > 0,
      count: countOf('experiences'),
      to: `${paths.portalPortfolioPart(id, 'academic')}?tab=experiences`,
    },
    {
      key: 'projects',
      label: 'Projects',
      done: countOf('projects') > 0,
      count: countOf('projects'),
      to: `${paths.portalPortfolioPart(id, 'content')}?tab=projects`,
    },
    {
      key: 'services',
      label: 'Services',
      done: countOf('services') > 0,
      count: countOf('services'),
      to: `${paths.portalPortfolioPart(id, 'content')}?tab=services`,
    },
    {
      key: 'publications',
      label: 'Publications',
      done: countOf('publications') > 0,
      count: countOf('publications'),
      to: `${paths.portalPortfolioPart(id, 'content')}?tab=publications`,
    },
    {
      key: 'contacts',
      label: 'Contact details',
      done: countOf('contacts') > 0,
      to: paths.portalPortfolioPart(id, 'contact'),
    },
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const percent = Math.round((doneCount / checklist.length) * 100)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader
            title="Your website"
            description={
              published
                ? 'Your portfolio is live and visible to everyone.'
                : 'Only you can see this portfolio until you publish it.'
            }
          />
          <CardContent className="space-y-4">
            {published && (
              <div className="border-line bg-surface flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <p className="text-heading min-w-0 flex-1 truncate text-sm">{siteUrl}</p>
                <CopyButton text={siteUrl} variant="secondary" />
                <Button
                  as="a"
                  href={paths.site(portfolio.slug)}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                  size="icon-sm"
                  aria-label="View site"
                >
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {published ? (
                <Button variant="secondary" onClick={() => setConfirmUnpublish(true)}>
                  <GlobeLock className="size-4" /> Unpublish
                </Button>
              ) : (
                <Button
                  loading={toggle.isPending}
                  onClick={() => toggle.mutate('publish')}
                >
                  <Globe className="size-4" /> Publish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Setup progress"
            description={`${doneCount} of ${checklist.length} steps done.`}
          />
          <CardContent className="space-y-4">
            <div className="bg-line h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Setup progress"
              />
            </div>
            <ul className="divide-line divide-y">
              {checklist.map((c) => (
                <li key={c.key}>
                  <Link
                    to={c.to}
                    className="hover:text-primary flex items-center gap-3 py-3 text-sm transition-colors"
                  >
                    {c.done ? (
                      <CheckCircle2 className="text-success size-5 shrink-0" />
                    ) : (
                      <Circle className="text-muted size-5 shrink-0" />
                    )}
                    <span className="text-heading flex-1">{c.label}</span>
                    {typeof c.count === 'number' && (
                      <span className="text-muted">{c.count} added</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Quick actions" />
          <CardContent className="flex flex-col gap-2">
            <Button as={Link} to={scope.itemPath(id, 'projects', 'new')} variant="soft">
              <Plus className="size-4" /> Add project
            </Button>
            <Button
              as={Link}
              to={scope.itemPath(id, 'publications', 'new')}
              variant="soft"
            >
              <Plus className="size-4" /> Add publication
            </Button>
            <Button
              as={Link}
              to={paths.portalPortfolioPart(id, 'contact')}
              variant="secondary"
            >
              Edit contact details
            </Button>
          </CardContent>
        </Card>

        <Card className="border-danger/30">
          <CardHeader
            title="Danger zone"
            description="Deleting a portfolio removes its website and content."
          />
          <CardContent>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4" /> Delete portfolio
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmUnpublish}
        onClose={() => setConfirmUnpublish(false)}
        onConfirm={() => toggle.mutate('unpublish')}
        loading={toggle.isPending}
        title="Unpublish this portfolio?"
        description="Your public website will go offline until you publish it again. Your data is kept."
        confirmLabel="Unpublish"
        variant="primary"
      />
      <DeleteModal
        portfolio={portfolio}
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
      />
    </div>
  )
}
