import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  Check,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { clientsResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useCrud } from '@/hooks/useCrud'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { buildFilePayload } from '@/lib/formData'
import { formatDate } from '@/lib/format'
import { paths } from '@/routes/paths'

// === Add / Edit client modal ===============================================
const clientSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  profession: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  location: z.string().trim().optional(),
  profile_photo: z.any().optional(),
})

// Schema ke keys se hi fields nikalte hain, taake dono jagah alag se maintain na karna pade
const FIELDS = Object.keys(clientSchema.shape)

// Backend field: profile_photo. Naya File chuna ho to multipart, warna normal JSON
// (purani photo ka URL wapas nahi bheja jata, warna PATCH fail hoga)
function buildPayload(values, original) {
  return buildFilePayload(values, ['profile_photo'], original)
}

function getDefaultValues(client) {
  return {
    full_name: client?.full_name ?? '',
    email: client?.email ?? '',
    profession: client?.profession ?? '',
    phone: client?.phone ?? '',
    organization: client?.organization ?? '',
    location: client?.location ?? '',
    profile_photo: client?.profile_photo ?? null,
  }
}

function ClientForm({ formId, client, onSubmit }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: getDefaultValues(client),
  })

  const submit = async (values) => {
    try {
      await onSubmit(buildPayload(values, client))
    } catch (error) {
      // Non-validation errors ka toast useCrud dikha deta hai
      if (error?.errors) applyServerErrors(error, setError, { fields: FIELDS })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      {/* Photo left, Full name + Email right (ek hi row) */}
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-7">
        <div className="flex justify-center">
          <Controller
            name="profile_photo"
            control={control}
            render={({ field }) => (
              <ImageUploader
                shape="circle-sm"
                label="Photo"
                showHint={false}
                value={field.value}
                onChange={field.onChange}
                error={errors.profile_photo?.message}
                className="flex flex-col items-center"
              />
            )}
          />
        </div>
        <div className="space-y-4">
          <FormField
            label="Full name"
            icon={User}
            error={errors.full_name?.message}
            required
          >
            <Input autoComplete="off" {...register('full_name')} />
          </FormField>
          <FormField label="Email" icon={Mail} error={errors.email?.message} required>
            <Input type="email" autoComplete="off" {...register('email')} />
          </FormField>
        </div>
      </div>

      <FormField label="Phone" icon={Phone} error={errors.phone?.message}>
        <Input type="tel" placeholder="+92 300 1234567" {...register('phone')} />
      </FormField>
      <FormField label="Profession" icon={Briefcase} error={errors.profession?.message}>
        <Input placeholder="Researcher" {...register('profession')} />
      </FormField>
      <FormField
        label="Organization"
        icon={Building2}
        error={errors.organization?.message}
      >
        <Input placeholder="University or institute" {...register('organization')} />
      </FormField>
      <FormField label="Location" icon={MapPin} error={errors.location?.message}>
        <Input placeholder="Lahore" {...register('location')} />
      </FormField>
    </form>
  )
}

// client = null: Add mode, object: Edit mode. onSubmit(payload) promise return kare (error par throw).
export function ClientFormModal({ open, onClose, client, onSubmit, saving }) {
  const formId = 'client-form'
  const isEdit = Boolean(client)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit client' : 'Add client'}
      description={
        isEdit ? 'Update the client details.' : 'Add a new researcher to the platform.'
      }
      size="lg"
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {!saving && <Check className="size-4" />}
            {isEdit ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      {/* Modal band hone par content unmount hota hai, isliye form har baar fresh khulta hai */}
      <ClientForm formId={formId} client={client} onSubmit={onSubmit} />
    </Modal>
  )
}

// === Clients page ==========================================================
const STATUS_BADGE = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  unpublished: { variant: 'danger', label: 'Unpublished' },
}

// Backend mein portfolio_status filter aa jaye to sirf isse true kar do:
// tab status server par filter hoga (saare pages par), warna sirf maujooda page par.
const BACKEND_STATUS_FILTER = false

const LOCAL_FILTER_HINT = 'Status filter sirf is page par lagta hai'

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status]
  if (!badge) return <Badge>No portfolio</Badge>
  return (
    <Badge variant={badge.variant} dot>
      {badge.label}
    </Badge>
  )
}

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [status, setStatus] = useState('')
  const { page, setPage, reset, pageSize } = usePagination()
  const [form, setForm] = useState({ open: false, client: null })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page,
      ...(BACKEND_STATUS_FILTER && { portfolio_status: status || undefined }),
    }),
    [debouncedSearch, page, status],
  )
  const crud = useCrud(clientsResource, { params, label: 'Client' })

  const hasFilters = Boolean(debouncedSearch || status)
  const localFilter = !BACKEND_STATUS_FILTER && status !== ''
  const rows = useMemo(
    () =>
      localFilter ? crud.items.filter((c) => c.portfolio_status === status) : crud.items,
    [crud.items, localFilter, status],
  )

  const openAdd = () => setForm({ open: true, client: null })
  const closeForm = () => setForm((f) => ({ ...f, open: false }))

  const handleSave = async (payload) => {
    if (form.client) await crud.update(form.client.id, payload)
    else await crud.create(payload)
    closeForm()
  }

  const handleDelete = async () => {
    try {
      await crud.remove(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      /* toast useCrud ne dikha diya */
    }
  }

  // setForm / setDeleteTarget stable hain, isliye deps khali rakhna theek hai
  const columns = useMemo(
    () => [
      {
        key: 'full_name',
        header: 'Client',
        cell: (c) => (
          <Link
            to={paths.adminClient(c.id)}
            className="text-heading hover:text-primary flex min-w-0 items-center gap-3 font-medium transition-colors"
          >
            <Avatar name={c.full_name} src={c.profile_photo} size="sm" />
            <span className="truncate">{c.full_name}</span>
          </Link>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        cell: (c) => <span className="block max-w-64 truncate">{c.email}</span>,
        className: 'text-muted',
      },
      {
        key: 'profession',
        header: 'Profession',
        cell: (c) => c.profession || <span className="text-muted">—</span>,
      },
      {
        key: 'portfolio_status',
        header: 'Status',
        cell: (c) => <StatusBadge status={c.portfolio_status} />,
      },
      {
        key: 'created_at',
        header: 'Created',
        cell: (c) => formatDate(c.created_at),
        className: 'whitespace-nowrap text-muted',
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (c) => (
          <DropdownMenu
            label={`Actions for ${c.full_name}`}
            items={[
              { label: 'View', icon: Eye, to: paths.adminClient(c.id) },
              {
                label: 'Edit',
                icon: Pencil,
                onClick: () => setForm({ open: true, client: c }),
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onClick: () => setDeleteTarget(c),
              },
            ]}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        description="Researchers whose portfolios you manage."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add Client
          </Button>
        }
      />

      <FilterBar className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 [&>*]:w-full [&>*]:max-w-none">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              reset()
            }}
            placeholder="Search name or email..."
          />
        </div>
        <Select
          aria-label="Filter by status"
          title={localFilter ? LOCAL_FILTER_HINT : undefined}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            if (BACKEND_STATUS_FILTER) reset()
          }}
          className="w-full shrink-0 sm:w-44"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_BADGE).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={rows}
        loading={crud.isLoading}
        fetching={crud.isFetching}
        error={crud.isError ? crud.error : null}
        onRetry={crud.refetch}
        pagination={{ page, count: crud.count, pageSize, onPageChange: setPage }}
        empty={
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No clients found' : 'No clients yet'}
            description={
              hasFilters
                ? 'Try a different search or status.'
                : 'Add your first client to get started.'
            }
            action={
              !hasFilters && (
                <Button onClick={openAdd}>
                  <Plus className="size-4" /> Add Client
                </Button>
              )
            }
          />
        }
      />

      <ClientFormModal
        open={form.open}
        client={form.client}
        onClose={closeForm}
        onSubmit={handleSave}
        saving={crud.isCreating || crud.isUpdating}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={crud.isDeleting}
        title="Delete client?"
        description={
          deleteTarget
            ? `${deleteTarget.full_name} and linked data will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
      />
    </div>
  )
}
