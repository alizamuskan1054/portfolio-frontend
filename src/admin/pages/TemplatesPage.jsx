import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react'
import { templatesResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { useCrud } from '@/hooks/useCrud'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'

// === Add / Edit modal ======================================================
const TEMPLATE_FIELDS = ['name', 'key', 'description', 'is_active']

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Too long'),
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens (e.g. academic-modern)',
    ),
  description: z.string().trim().max(500, 'Max 500 characters').optional(),
  is_active: z.boolean(),
})

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function TemplateForm({ formId, template, onSubmit }) {
  const isEdit = Boolean(template)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? '',
      key: template?.key ?? '',
      description: template?.description ?? '',
      is_active: template?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      applyServerErrors(error, setError, { fields: TEMPLATE_FIELDS })
    }
  })

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.stopPropagation()
        submit(e)
      }}
      className="space-y-5"
    >
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="Name" error={errors.name?.message} required>
        <Input
          placeholder="Academic Modern"
          {...register('name', {
            // Naye template mein key naam se khud ban jati hai (jab tak tum key khud na badlo)
            onChange: (e) => {
              if (!isEdit && !dirtyFields.key) setValue('key', slugify(e.target.value))
            },
          })}
        />
      </FormField>

      <FormField
        label="Key"
        error={errors.key?.message}
        hint={
          isEdit
            ? 'The key cannot be changed after creation.'
            : 'Unique id used by the website, e.g. academic-modern.'
        }
        required
      >
        <Input placeholder="academic-modern" disabled={isEdit} {...register('key')} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea
          rows={3}
          placeholder="A clean, modern layout for researchers."
          {...register('description')}
        />
      </FormField>

      <Controller
        name="is_active"
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={field.onChange}
            label="Active"
            description="Only active templates can be chosen for new portfolios."
          />
        )}
      />
    </form>
  )
}

function TemplateModal({ open, onClose, template, onSubmit, saving }) {
  const formId = 'template-form'
  const isEdit = Boolean(template)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit template' : 'Add template'}
      description={
        isEdit ? 'Update the template details.' : 'Add a new website template.'
      }
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEdit ? 'Save changes' : 'Add template'}
          </Button>
        </>
      }
    >
      <TemplateForm formId={formId} template={template} onSubmit={onSubmit} />
    </Modal>
  )
}

// === Templates page ========================================================
export function TemplatesPage() {
  const crud = useCrud(templatesResource, { label: 'Template' })
  const [form, setForm] = useState({ open: false, template: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const openAdd = () => setForm({ open: true, template: null })
  const closeForm = () => setForm((f) => ({ ...f, open: false }))

  const handleSave = async (values) => {
    if (form.template) await crud.update(form.template.id, values)
    else await crud.create(values)
    closeForm()
  }

  const toggleActive = async (template, next) => {
    setTogglingId(template.id)
    try {
      await crud.update(template.id, { is_active: next })
    } catch {
      /* toast useCrud ne dikha diya */
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    try {
      await crud.remove(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      /* toast useCrud ne dikha diya */
    }
  }

  const addButton = (
    <Button onClick={openAdd}>
      <Plus className="size-4" /> Add template
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Templates"
        description="Website designs your clients' portfolios can use."
        actions={addButton}
      />

      {crud.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : crud.isError ? (
        <ErrorState message={crud.error.message} onRetry={crud.refetch} />
      ) : crud.items.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Add a template so portfolios can pick a design."
          action={addButton}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {crud.items.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="bg-accent/20 text-accent-text flex size-11 items-center justify-center rounded-xl">
                  <LayoutTemplate className="size-5" />
                </span>
                <Badge variant={t.is_active ? 'success' : 'neutral'} dot>
                  {t.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <h3 className="mt-4 text-xl">{t.name}</h3>
              <code className="bg-surface text-muted mt-1 w-fit rounded px-1.5 py-0.5 text-xs">
                {t.key}
              </code>
              <p className="text-muted mt-3 line-clamp-3 flex-1 text-sm">
                {t.description || 'No description.'}
              </p>

              <div className="border-line mt-5 flex items-center justify-between gap-3 border-t pt-4">
                <Switch
                  checked={Boolean(t.is_active)}
                  onChange={(next) => toggleActive(t, next)}
                  disabled={togglingId === t.id}
                  label={t.is_active ? 'Active' : 'Inactive'}
                  className="gap-3"
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${t.name}`}
                    onClick={() => setForm({ open: true, template: t })}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${t.name}`}
                    className="hover:bg-danger/10 hover:text-danger"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateModal
        open={form.open}
        template={form.template}
        onClose={closeForm}
        onSubmit={handleSave}
        saving={crud.isCreating || crud.isUpdating}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={crud.isDeleting}
        title="Delete template?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Portfolios using it may be affected.`
            : ''
        }
        confirmLabel="Delete"
      />
    </>
  )
}
