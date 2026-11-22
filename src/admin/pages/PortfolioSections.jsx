import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { usePortfolioScope } from '@/features/portfolio/scope'
import { describeItem } from '../itemDisplay'
import { ContactLinks } from './ContactLinks'
import {
  ACADEMIC_TABS,
  CATEGORY_TABS,
  CONTENT_TABS,
  SECTIONS,
  findKindField,
  matchesKind,
  pickDisplay,
  resources,
  toList,
  useSectionSchema,
} from '../sections'

// === List of one section (add / edit alag page par khulte hain) =============
function ApiSection({ path, portfolioId, kind }) {
  const config = SECTIONS[path]
  const resource = resources[path]
  const queryClient = useQueryClient()
  const schema = useSectionSchema(path)
  const kindField = path === 'categories' ? findKindField(schema.fields) : null
  const qs = kind && kindField ? `?kind=${kind}` : ''
  const [deleteTarget, setDeleteTarget] = useState(null)
  const scope = usePortfolioScope()

  const params = { portfolio: portfolioId }
  const query = useQuery({
    queryKey: resource.keys.list(params),
    queryFn: () => resource.list(params),
  })
  const items = toList(query.data).filter((i) => !kind || matchesKind(kindField, i, kind))
  const refresh = () => queryClient.invalidateQueries({ queryKey: resource.keys.all })

  const update = useMutation({
    mutationFn: ({ id, data }) => resource.update(id, data),
    onSuccess: () => refresh(),
    onError: (e) => notify.error(e),
  })
  const remove = useMutation({
    mutationFn: (id) => resource.remove(id),
    onSuccess: () => {
      notify.success(`${config.singular} deleted.`)
      setDeleteTarget(null)
      return refresh()
    },
    onError: (e) => notify.error(e),
  })
  const reorder = useMutation({
    mutationFn: (next) =>
      api.post(
        `/portfolios/${path}/reorder/`,
        next.map((item, i) => ({ id: item.id, display_order: i })),
      ),
    onSuccess: () => refresh(),
    onError: (e) => {
      notify.error(e)
      refresh()
    },
  })

  const shown = reorder.isPending ? reorder.variables : items
  const canAdd = config.max === undefined || items.length < config.max
  const hasToggle = config.toggle && schema.fields?.some((f) => f.name === config.toggle)

  const move = (from, to) => {
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    reorder.mutate(next)
  }

  const addButton = canAdd ? (
    <Button as={Link} to={`${scope.itemPath(portfolioId, path, 'new')}${qs}`}>
      <Plus className="size-4" /> Add {config.singular.toLowerCase()}
    </Button>
  ) : null

  if (query.isError) {
    return (
      <EmptyState
        title={`Could not load ${config.label.toLowerCase()}`}
        description={query.error?.message}
        action={<Button onClick={() => query.refetch()}>Try again</Button>}
      />
    )
  }
  if (query.isLoading || schema.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {path === 'categories' && !kindField && (
        <p className="bg-warning/10 text-warning rounded-lg px-3 py-2 text-sm">
          Backend categories have no type (project / blog) field, so blog and project
          share this list. Ask the backend to add one to keep them separate.
        </p>
      )}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted text-sm">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </p>
          {addButton}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={`No ${config.label.toLowerCase()} yet`}
          description={`Add your first ${config.singular.toLowerCase()}.`}
          action={addButton}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((item, index) => {
            const d = schema.fields ? pickDisplay(schema.fields, item) : {}
            const info = describeItem(item, d)
            return (
              <li key={item.id}>
                <Card className="flex items-center gap-3 p-3 sm:p-4">
                  <span className="bg-primary-soft text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                    {index + 1}
                  </span>
                  <Link
                    to={`${scope.itemPath(portfolioId, path, item.id)}${qs}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-heading truncate font-medium">{info.title}</p>
                    {info.subtitle && (
                      <p className="text-muted truncate text-sm">{info.subtitle}</p>
                    )}
                    {(info.period || info.badges.length > 0) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {info.period && (
                          <span className="text-muted text-xs">{info.period}</span>
                        )}
                        {info.badges.map((b) => (
                          <span
                            key={b}
                            className="bg-primary-soft text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                  {hasToggle && (
                    <Switch
                      checked={item[config.toggle] !== false}
                      onChange={(checked) =>
                        update.mutate({ id: item.id, data: { [config.toggle]: checked } })
                      }
                      className="shrink-0"
                    />
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    {config.reorder && items.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move down"
                          disabled={index === items.length - 1}
                          onClick={() => move(index, index + 1)}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      as={Link}
                      to={`${scope.itemPath(portfolioId, path, item.id)}${qs}`}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      className="hover:bg-danger/10 hover:text-danger"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove.mutate(deleteTarget.id)}
        loading={remove.isPending}
        title={`Delete ${config.singular.toLowerCase()}?`}
        description="This entry will be removed permanently."
        confirmLabel="Delete"
      />
    </div>
  )
}

// === Tabs wrapper: wizard ke Step 3 / Step 4 ================================
// Active tab URL mein (?tab=awards) rehta hai: form page se wapas aane par wahin khulta hai.
export function SectionTabs({ group, portfolioId, exclude = [] }) {
  const categorySchema = useSectionSchema('categories', { enabled: group === 'content' })
  const split = Boolean(findKindField(categorySchema.fields))
  const tabs =
    group === 'academic'
      ? ACADEMIC_TABS
      : CONTENT_TABS.filter((t) => !exclude.includes(t)).flatMap((t) =>
          t === 'categories' && split ? [CATEGORY_TABS.project, CATEGORY_TABS.blog] : [t],
        )
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const active = tabs.includes(requested) ? requested : tabs[0]
  const labelOf = (key) =>
    key === 'contact-links'
      ? 'Contact & links'
      : key === CATEGORY_TABS.project
        ? 'Project categories'
        : key === CATEGORY_TABS.blog
          ? 'Blog categories'
          : SECTIONS[key].label

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Sections"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() =>
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('tab', key)
                  return next
                },
                { replace: true },
              )
            }
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              active === key
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line bg-card text-body hover:border-primary',
            )}
          >
            {labelOf(key)}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={active}>
        {active === 'contact-links' ? (
          <ContactLinks portfolioId={portfolioId} />
        ) : (
          <ApiSection
            path={active in SECTIONS ? active : 'categories'}
            portfolioId={portfolioId}
            kind={
              active === CATEGORY_TABS.project
                ? 'project'
                : active === CATEGORY_TABS.blog
                  ? 'blog'
                  : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
