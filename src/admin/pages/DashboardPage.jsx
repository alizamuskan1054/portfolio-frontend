import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  EyeOff,
  FileText,
  FolderKanban,
  Globe,
  LayoutTemplate,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clientsResource, dashboardApi, templatesResource } from '@/api/endpoints'
import { useAuth } from '@/admin/auth'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/theme-context'
import { paths } from '@/routes/paths'

// =====================================================================================
// ADMIN DASHBOARD (v2)
//   * Metric cards: icon ke saath heading (upar), count neeche, neeche wali footer lines hata di.
//     Poora card clickable (Link): hover par uthta hai, neeche gradient line, arrow hilta hai.
//     Count scroll/load par 0 se ginta hai.
//   * Hero: gradient glow + dot grid + chalti sheen line.
//   * Draft banner, quick actions: halke hover/focus polish.
//   * prefers-reduced-motion par animations band.
// =====================================================================================

const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))
const percent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0)

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_BADGE = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  unpublished: { variant: 'danger', label: 'Unpublished' },
}

// Is page ki animations/hover CSS (db-*): alag CSS file mein kuch add nahi karna
const DASH_CSS = `
@keyframes db-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes db-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes db-drift { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(28px, 18px, 0) scale(1.08); } }

.db-hero { position: relative; isolation: isolate; }
.db-hero::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
  background-size: 200% 100%; animation: db-sheen 6s linear infinite; }
.db-dots { position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: radial-gradient(color-mix(in srgb, var(--c-on-navy) 22%, transparent) 1px, transparent 1px); background-size: 22px 22px;
  -webkit-mask-image: linear-gradient(115deg, transparent 30%, #000 100%); mask-image: linear-gradient(115deg, transparent 30%, #000 100%); }
.db-glow { position: absolute; pointer-events: none; border-radius: 9999px; filter: blur(60px); animation: db-drift 16s ease-in-out infinite; }

.db-metric { position: relative; display: block; overflow: hidden; padding: 0.875rem 1rem; border-radius: 1rem; text-decoration: none; color: inherit;
  border: 1px solid var(--c-line); background: var(--c-card); box-shadow: 0 1px 2px color-mix(in srgb, var(--c-navy) 6%, transparent);
  transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s;
  animation: db-rise .55s cubic-bezier(.2,.7,.2,1) both; animation-delay: var(--d, 0ms); }
.db-metric::after { content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform: scaleX(0); transform-origin: left;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent)); transition: transform .45s cubic-bezier(.2,.7,.2,1); }
.db-metric:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--c-primary) 45%, var(--c-line));
  box-shadow: 0 18px 34px -22px var(--c-primary); }
.db-metric:hover::after, .db-metric:focus-visible::after { transform: scaleX(1); }
.db-metric:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.db-icon { transition: transform .35s cubic-bezier(.2,.7,.2,1); }
.db-metric:hover .db-icon { transform: scale(1.08) rotate(-4deg); }
.db-arrow { transition: transform .25s, color .25s, opacity .25s; opacity: .55; }
.db-metric:hover .db-arrow, .db-metric:focus-visible .db-arrow { transform: translate(2px, -2px); color: var(--c-primary); opacity: 1; }

.db-banner { position: relative; overflow: hidden; animation: db-rise .55s cubic-bezier(.2,.7,.2,1) both; animation-delay: .35s; }
.db-banner::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c-warning); }
.db-action { transition: transform .25s, border-color .25s, background-color .25s, box-shadow .25s; }
.db-action:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -16px var(--c-primary); }

@media (prefers-reduced-motion: reduce) {
  .db-hero::after, .db-glow, .db-metric, .db-banner { animation: none !important; }
  .db-metric, .db-icon, .db-arrow, .db-action, .db-metric::after { transition: none !important; }
  .db-metric:hover, .db-action:hover, .db-metric:hover .db-icon { transform: none; }
}
`

// 0 se target tak ginta hai (reduced-motion par seedha target)
function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    const number = Number(target) || 0
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || number === 0) {
      setValue(number)
      return undefined
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(number * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])
  return value
}

// ---------- Hero ----------
function Hero({ firstName }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="db-hero bg-navy text-on-navy relative mb-6 overflow-hidden rounded-2xl p-6 sm:p-8">
      <span className="db-glow bg-primary/40" style={{ top: '-6rem', right: '-3rem', width: '16rem', height: '16rem' }} aria-hidden="true" />
      <span
        className="db-glow bg-accent/25"
        style={{ bottom: '-7rem', left: '20%', width: '12rem', height: '12rem', animationDuration: '22s' }}
        aria-hidden="true"
      />
      <span className="db-dots" aria-hidden="true" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-on-navy/60 text-sm">{today}</p>
          <h1 className="text-on-navy mt-1 text-3xl sm:text-4xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-on-navy/70 mt-2">
            Manage clients, build portfolio websites and publish them from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to={paths.adminClients} variant="secondary">
            <UserPlus className="size-4" /> Add client
          </Button>
          <Button as={Link} to={paths.adminPortfolioNew}>
            <Plus className="size-4" /> Create portfolio
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------- Stat card (poora clickable) ----------
const TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  accent: 'bg-accent/20 text-accent-text',
}

// Layout: [icon] Heading ↗ (upar), neeche bara count (aur ek side par badge), phir optional progress bar.
// Footer lines nahi. Poora card `to` par le jata hai.
function MetricCard({ icon: Icon, tone = 'primary', label, value, loading, badge, progress, to, index = 0 }) {
  const counted = useCountUp(value, !loading)

  return (
    <Link to={to} className="db-metric group" style={{ '--d': `${index * 70}ms` }} aria-label={`${label}: ${loading ? 'loading' : formatNumber(value ?? 0)}. Open ${label.toLowerCase()}`}>
      <div className="flex items-center gap-3">
        <span className={cn('db-icon flex size-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="size-5" />
        </span>
        <p className="text-heading min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
        <ArrowUpRight className="db-arrow text-muted size-4 shrink-0" aria-hidden="true" />
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-heading font-serif text-3xl leading-none font-semibold tabular-nums">
            {formatNumber(Math.round(counted))}
          </p>
        )}
        {badge}
      </div>

      {progress !== undefined && (
        <div className="bg-surface mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--c-success), color-mix(in srgb, var(--c-success) 60%, var(--c-primary)))' }}
          />
        </div>
      )}
    </Link>
  )
}

// ---------- Charts (recharts) ----------
// Colors theme se aate hain (CSS variables), isliye dark mode mein khud badalte hain.
// "Unpublished" ka neutral gray alag hai (light/dark), validator se checked.
const NEUTRAL = { light: '#9C9082', dark: '#8F97C4' }
const AXIS_TICK = { fill: 'var(--c-muted)', fontSize: 12 }

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  const point = payload[0]
  return (
    <div className="border-line bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="text-muted">{point.payload.full ?? point.name}</p>
      <p className="text-heading text-sm font-semibold">
        {formatNumber(point.value)} {unit}
      </p>
    </div>
  )
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

// Recent-activity items ko din ke hisab se ginna (khali din = 0)
function buildDailyCounts(items, days) {
  const today = new Date()
  const counts = new Map()
  items.forEach((item) => {
    const d = new Date(item.created_at)
    if (!Number.isNaN(d.getTime()))
      counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1)
  })
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      full: d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      count: counts.get(dayKey(d)) ?? 0,
    }
  })
}

function ActivityTrend() {
  const [days, setDays] = useState(14)
  const query = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
  })
  const data = useMemo(
    () => buildDailyCounts(toList(query.data), days),
    [query.data, days],
  )
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Platform activity"
        description={
          query.isSuccess
            ? `${formatNumber(total)} actions in the last ${days} days`
            : 'Actions per day'
        }
        action={
          <div
            role="group"
            aria-label="Time range"
            className="bg-surface flex rounded-lg p-0.5"
          >
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                aria-pressed={days === r.days}
                onClick={() => setDays(r.days)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  days === r.days
                    ? 'bg-card text-primary shadow-xs'
                    : 'text-muted hover:text-heading',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />
      <CardContent>
        {query.isPending ? (
          <Skeleton className="h-60 w-full" />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={query.refetch} />
        ) : (
          <>
            <div
              className="h-60 w-full"
              role="img"
              aria-label={`Actions per day, last ${days} days`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--c-primary)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--c-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--c-line)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={AXIS_TICK}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={AXIS_TICK}
                    width={44}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="actions" />}
                    cursor={{ stroke: 'var(--c-muted)', strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--c-primary)"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: 'var(--c-primary)',
                      stroke: 'var(--c-card)',
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Table view: screen reader ke liye */}
            <table className="sr-only">
              <caption>Actions per day</caption>
              <tbody>
                {data.map((d) => (
                  <tr key={d.full}>
                    <th scope="row">{d.full}</th>
                    <td>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted mt-2 text-xs">
              Based on the latest actions returned by the server.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Portfolio status (donut) ----------
function StatusDonut({ stats, loading }) {
  const { resolved } = useTheme()
  const total = stats?.total_portfolios ?? 0
  const published = stats?.published_portfolios ?? 0
  const draft = stats?.draft_portfolios ?? 0
  const other = Math.max(0, total - published - draft)

  const rows = [
    { name: 'Published', value: published, color: 'var(--c-success)' },
    { name: 'Draft', value: draft, color: 'var(--c-warning)' },
    ...(other > 0
      ? [{ name: 'Unpublished', value: other, color: NEUTRAL[resolved] }]
      : []),
  ]

  return (
    <Card>
      <CardHeader
        title="Portfolio status"
        description="Share of portfolios by state"
        action={
          <Button as={Link} to={paths.adminPortfolios} variant="ghost" size="sm">
            View <ArrowRight className="size-4" />
          </Button>
        }
      />
      <CardContent>
        {loading ? (
          <Skeleton className="mx-auto size-44 rounded-full" />
        ) : total === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No portfolios yet"
            description="Create the first portfolio to see its status."
            action={
              <Button as={Link} to={paths.adminPortfolioNew}>
                <Plus className="size-4" /> Create portfolio
              </Button>
            }
          />
        ) : (
          <>
            <div
              className="relative mx-auto h-48 w-48"
              role="img"
              aria-label="Portfolio status donut chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="var(--c-card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {rows.map((r) => (
                      <Cell key={r.name} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="portfolios" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-heading font-serif text-3xl font-semibold">
                  {formatNumber(total)}
                </span>
                <span className="text-muted text-xs">portfolios</span>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {rows.map((r) => (
                <li key={r.name} className="flex items-center gap-3 text-sm">
                  <span
                    className="size-3 shrink-0 rounded-sm"
                    style={{ background: r.color }}
                  />
                  <span className="text-heading flex-1">{r.name}</span>
                  <span className="text-heading font-semibold">
                    {formatNumber(r.value)}
                  </span>
                  <span className="text-muted w-10 text-right text-xs">
                    {percent(r.value, total)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Getting started ----------
function GettingStarted({ stats, loading }) {
  const steps = [
    {
      label: 'Add your first client',
      done: (stats?.total_clients ?? 0) > 0,
      to: paths.adminClients,
    },
    {
      label: 'Create a portfolio',
      done: (stats?.total_portfolios ?? 0) > 0,
      to: paths.adminPortfolioNew,
    },
    {
      label: 'Publish it',
      done: (stats?.published_portfolios ?? 0) > 0,
      to: paths.adminPortfolios,
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <Card>
      <CardHeader
        title="Getting started"
        description={loading ? ' ' : `${doneCount} of ${steps.length} steps done`}
      />
      <CardContent>
        <div className="bg-surface mb-4 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${percent(doneCount, steps.length)}%` }}
          />
        </div>
        <ul className="space-y-1">
          {steps.map((step) => (
            <li key={step.label}>
              <Link
                to={step.to}
                className="hover:bg-primary-soft flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
              >
                {step.done ? (
                  <CheckCircle2 className="text-success size-5 shrink-0" />
                ) : (
                  <Circle className="text-muted size-5 shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    step.done ? 'text-muted line-through' : 'text-heading font-medium',
                  )}
                >
                  {step.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ---------- Recent clients ----------
function RecentClients() {
  const query = useQuery({
    queryKey: clientsResource.keys.list({ ordering: '-created_at', recent: true }),
    queryFn: () => clientsResource.list({ ordering: '-created_at' }),
  })
  const clients = toList(query.data).slice(0, 5)

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Recent clients"
        description="Newest clients and their portfolio status"
        action={
          <Button as={Link} to={paths.adminClients} variant="ghost" size="sm">
            Directory <ArrowRight className="size-4" />
          </Button>
        }
      />
      <CardContent className="p-0">
        {query.isPending ? (
          <div className="space-y-4 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={query.refetch}
            className="m-5"
          />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to get started."
            className="m-5"
          />
        ) : (
          <ul className="divide-line @container divide-y">
            {clients.map((c) => {
              const badge = STATUS_BADGE[c.portfolio_status]
              return (
                <li
                  key={c.id}
                  className="hover:bg-primary-soft/40 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-5 py-3.5 transition-colors @md:grid-cols-[auto_minmax(0,1fr)_8.5rem_9.5rem] @2xl:grid-cols-[auto_minmax(0,1fr)_8.5rem_5.5rem_9.5rem]"
                >
                  <Avatar name={c.full_name} src={c.profile_photo} />
                  <div className="min-w-0">
                    <Link
                      to={paths.adminClient(c.id)}
                      className="text-heading hover:text-primary block truncate text-sm font-medium"
                    >
                      {c.full_name}
                    </Link>
                    <p className="text-muted truncate text-xs">{c.email}</p>
                  </div>
                  <div className="col-start-2 @md:col-start-auto">
                    {badge ? (
                      <Badge variant={badge.variant} dot>
                        {badge.label}
                      </Badge>
                    ) : (
                      <Badge>No portfolio</Badge>
                    )}
                  </div>
                  <span className="text-muted hidden text-right text-xs @2xl:block">
                    {formatRelative(c.created_at)}
                  </span>
                  <div className="col-start-2 @md:col-start-auto @md:justify-self-end">
                    {badge ? (
                      <Button
                        as={Link}
                        to={paths.adminClient(c.id)}
                        variant="ghost"
                        size="sm"
                      >
                        View
                      </Button>
                    ) : (
                      <Button
                        as={Link}
                        to={`${paths.adminPortfolioNew}?client=${c.id}`}
                        variant="soft"
                        size="sm"
                      >
                        Create portfolio
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Quick actions ----------
const QUICK_ACTIONS = [
  { label: 'Add client', icon: UserPlus, to: paths.adminClients },
  { label: 'New portfolio', icon: Plus, to: paths.adminPortfolioNew },
  { label: 'Templates', icon: LayoutTemplate, to: paths.adminTemplates },
  { label: 'Portfolios', icon: FolderKanban, to: paths.adminPortfolios },
]

function QuickActions() {
  return (
    <Card>
      <CardHeader title="Quick actions" />
      <CardContent className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="db-action border-line hover:border-primary hover:bg-primary-soft focus-visible:ring-primary flex flex-col items-center gap-2 rounded-xl border p-4 text-center focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </span>
            <span className="text-heading text-sm font-medium">{label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

// ---------- Recent activity ----------
function activityIcon(action = '') {
  if (action.includes('unpublish')) return EyeOff
  if (action.includes('publish')) return Globe
  if (action.includes('delete')) return Trash2
  if (action.includes('client')) return UserPlus
  return Activity
}

function RecentActivity() {
  const query = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
  })
  const items = toList(query.data)

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Recent activity"
        description="Latest 6 actions on the platform"
      />
      <CardContent className="p-0">
        {query.isPending ? (
          <div className="space-y-4 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={query.refetch}
            className="m-5"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Actions will show up here."
            className="m-5"
          />
        ) : (
          <ul className="divide-line divide-y">
            {items.slice(0, 6).map((item) => {
              const Icon = activityIcon(item.action)
              return (
                <li key={item.id} className="hover:bg-primary-soft/40 flex items-start gap-3 px-5 py-4 transition-colors">
                  <span className="bg-primary-soft text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-heading text-sm">{item.description}</p>
                    {item.actor_name && (
                      <p className="text-muted text-xs">by {item.actor_name}</p>
                    )}
                  </div>
                  <time
                    dateTime={item.created_at}
                    className="text-muted shrink-0 text-xs"
                  >
                    {formatRelative(item.created_at)}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Templates ----------
function TemplatesCard() {
  const query = useQuery({
    queryKey: templatesResource.keys.list({}),
    queryFn: () => templatesResource.list(),
    retry: false,
  })
  const templates = toList(query.data)
  const active = templates.filter((t) => t.is_active !== false)

  return (
    <Card>
      <CardHeader
        title="Templates"
        description={query.isSuccess ? `${active.length} active` : 'Website designs'}
        action={
          <Button as={Link} to={paths.adminTemplates} variant="ghost" size="sm">
            Manage <ArrowRight className="size-4" />
          </Button>
        }
      />
      <CardContent>
        {query.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : query.isError ? (
          <p className="text-muted text-sm">Could not load templates.</p>
        ) : active.length === 0 ? (
          <p className="text-muted text-sm">No active templates yet.</p>
        ) : (
          <ul className="space-y-3">
            {active.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span className="bg-accent/20 text-accent-text flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <LayoutTemplate className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-heading truncate text-sm font-medium">{t.name}</p>
                  <p className="text-muted truncate text-xs">{t.key}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Page ----------
export function DashboardPage() {
  const { user } = useAuth()
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  })
  const stats = statsQuery.data
  const loading = statsQuery.isPending

  const total = stats?.total_portfolios ?? 0
  const published = stats?.published_portfolios ?? 0
  const draft = stats?.draft_portfolios ?? 0
  const publishRate = percent(published, total)

  return (
    <>
      <style>{DASH_CSS}</style>
      <Hero firstName={user?.full_name?.split(' ')[0]} />

      {statsQuery.isError ? (
        <ErrorState
          message={statsQuery.error.message}
          onRetry={statsQuery.refetch}
          className="mb-6"
        />
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            index={0}
            icon={Users}
            label="Total clients"
            value={stats?.total_clients}
            loading={loading}
            to={paths.adminClients}
          />
          <MetricCard
            index={1}
            icon={FolderKanban}
            tone="accent"
            label="Total portfolios"
            value={stats?.total_portfolios}
            loading={loading}
            to={paths.adminPortfolios}
          />
          <MetricCard
            index={2}
            icon={Globe}
            tone="success"
            label="Published"
            value={stats?.published_portfolios}
            loading={loading}
            to={paths.adminPortfolios}
            badge={
              !loading &&
              total > 0 && <Badge variant="success">{publishRate}% live</Badge>
            }
            progress={loading ? undefined : publishRate}
          />
          <MetricCard
            index={3}
            icon={FileText}
            tone="warning"
            label="Drafts"
            value={stats?.draft_portfolios}
            loading={loading}
            to={paths.adminPortfolios}
            badge={!loading && draft > 0 && <Badge variant="warning">Needs review</Badge>}
          />
        </div>
      )}

      {!loading && draft > 0 && (
        <div
          role="status"
          className="db-banner border-warning/30 bg-warning/10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border py-3.5 pr-5 pl-6"
        >
          <p className="text-heading text-sm">
            <span className="font-semibold">
              {draft} {draft === 1 ? 'portfolio is' : 'portfolios are'} still in draft.
            </span>{' '}
            <span className="text-muted">Review and publish them to make them live.</span>
          </p>
          <Button as={Link} to={paths.adminPortfolios} variant="secondary" size="sm">
            Review drafts
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityTrend />
        <StatusDonut stats={stats} loading={loading} />
        <RecentClients />
        <GettingStarted stats={stats} loading={loading} />
        <RecentActivity />
        <div className="space-y-6">
          <QuickActions />
          <TemplatesCard />
        </div>
      </div>
    </>
  )
}