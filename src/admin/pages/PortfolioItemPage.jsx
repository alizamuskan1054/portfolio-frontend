import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { FileUploader, ImageDropzone } from '@/components/shared/FileUploader'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { toFormData } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { usePortfolioScope } from '@/features/portfolio/scope'
import {
  ACADEMIC_TABS,
  CATEGORY_KINDS,
  CATEGORY_TABS,
  SECTIONS,
  findKindField,
  kindValue,
  matchesKind,
  buildPayload,
  galleryResource,
  resources,
  toList,
  useSectionSchema,
} from '../sections'

const FULL = ['textarea', 'rich', 'image', 'file', 'checkbox']

// Related field (jaise Category): dropdown / checkboxes, options isi portfolio ki related entries se
function RelationControl({ field, register, control, error, portfolioId, kind }) {
  const { name, label, required, relation } = field
  const resource = resources[relation.path]
  const scope = usePortfolioScope()
  const query = useQuery({
    queryKey: resource.keys.list({ portfolio: portfolioId }),
    queryFn: () => resource.list({ portfolio: portfolioId }),
  })
  const kindField = findKindField(
    useSectionSchema('categories', { enabled: relation.path === 'categories' }).fields,
  )
  const options = toList(query.data).filter(
    (o) => !kind || matchesKind(kindField, o, kind),
  )
  const nameOf = (o) => o[relation.labelKey] ?? o.title ?? `#${o.id}`
  const addLink = `${scope.itemPath(portfolioId, relation.path, 'new')}${kind && kindField ? `?kind=${kind}` : ''}`
  const hint =
    !query.isLoading && options.length === 0 ? (
      <>
        No {kind && kindField ? `${kind} ` : ''}
        {SECTIONS[relation.path].label.toLowerCase()} yet.{' '}
        <Link to={addLink} className="text-primary underline">
          Add one first
        </Link>
        , then come back.
      </>
    ) : undefined

  if (relation.multiple) {
    return (
      <FormField label={label} required={required} hint={hint} error={error}>
        <Controller
          name={name}
          control={control}
          rules={{
            validate: (v) => !required || (v && v.length > 0) || `${label} is required`,
          }}
          render={({ field: f }) => (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const on = (f.value ?? []).map(String).includes(String(o.id))
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      f.onChange(
                        on
                          ? (f.value ?? []).filter((x) => String(x) !== String(o.id))
                          : [...(f.value ?? []), o.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-card text-body'}`}
                  >
                    {nameOf(o)}
                  </button>
                )
              })}
            </div>
          )}
        />
      </FormField>
    )
  }

  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      <Select
        placeholder={query.isLoading ? 'Loading...' : `Select ${label.toLowerCase()}`}
        {...register(name, { required: required ? `${label} is required` : false })}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {nameOf(o)}
          </option>
        ))}
      </Select>
    </FormField>
  )
}

// === Ek field ===============================================================
export function FieldControl({ field, register, control, error, portfolioId, kind }) {
  const { name, label, type, required, hint, options = [], maxLength } = field
  const rules = {
    required: required ? `${label} is required` : false,
    ...(field.validate && { validate: field.validate }),
    ...(maxLength &&
      type !== 'rich' && {
        maxLength: { value: maxLength, message: `Max ${maxLength} characters` },
      }),
  }

  if (type === 'relation')
    return (
      <RelationControl
        field={field}
        register={register}
        control={control}
        error={error}
        portfolioId={portfolioId}
        kind={kind}
      />
    )

  if (type === 'checkbox')
    return (
      <div className="space-y-1.5">
        <Checkbox label={label} description={hint} {...register(name, rules)} />
        {error && (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        )}
      </div>
    )

  if (type === 'image') {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field: f }) => (
          <ImageUploader
            label={label}
            value={f.value}
            onChange={f.onChange}
            error={error}
          />
        )}
      />
    )
  }

  if (type === 'file') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: f }) => (
          <div>
            <p className="text-heading mb-2 text-sm font-medium">
              {label}
              {required && <span className="text-danger"> *</span>}
            </p>
            <FileUploader
              label={`Upload ${label.toLowerCase()}`}
              accept="application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              acceptLabel="PDF, Word or image"
              value={f.value}
              onChange={f.onChange}
              error={error}
            />
            {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
          </div>
        )}
      />
    )
  }

  if (type === 'rich') {
    return (
      <FormField label={label} required={required} hint={hint} error={error}>
        <Controller
          name={name}
          control={control}
          rules={{ required: required ? `${label} is required` : false }}
          render={({ field: f }) => (
            <RichTextEditor
              value={f.value}
              onChange={f.onChange}
              invalid={Boolean(error)}
            />
          )}
        />
      </FormField>
    )
  }

  let input
  if (type === 'textarea') input = <Textarea rows={4} {...register(name, rules)} />
  else if (type === 'select')
    input = (
      <Select placeholder="Select..." {...register(name, rules)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    )
  else input = <Input type={type} {...register(name, rules)} />

  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      {input}
    </FormField>
  )
}

// === Project gallery ========================================================
function ProjectGallery({ projectId }) {
  const queryClient = useQueryClient()
  const params = { project: projectId }
  const query = useQuery({
    queryKey: galleryResource.keys.list(params),
    queryFn: () => galleryResource.list(params),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: galleryResource.keys.all })
  const upload = useMutation({
    mutationFn: async (files) => {
      for (const file of files)
        await galleryResource.create(toFormData({ project: projectId, image: file }))
    },
    onSuccess: refresh,
    onError: (e) => notify.error(e),
  })
  const remove = useMutation({
    mutationFn: (id) => galleryResource.remove(id),
    onSuccess: refresh,
    onError: (e) => notify.error(e),
  })

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-heading font-medium">Gallery</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {toList(query.data).map((img) => (
            <div
              key={img.id}
              className="bg-surface relative aspect-square overflow-hidden rounded-lg"
            >
              <img src={img.image} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => remove.mutate(img.id)}
                className="bg-navy/70 text-on-navy absolute top-1 right-1 flex size-7 items-center justify-center rounded-full"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <ImageDropzone
          onFiles={(files) => upload.mutate(files)}
          busy={upload.isPending}
        />
      </CardContent>
    </Card>
  )
}

// Naye project par: images pehle yahin chuno, project save hote hi upload ho jati hain
function PendingGallery({ items, onAdd, onRemove }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-heading font-medium">Gallery</p>
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {items.map((it) => (
              <div
                key={it.url}
                className="bg-surface relative aspect-square overflow-hidden rounded-lg"
              >
                <img src={it.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onRemove(it)}
                  className="bg-navy/70 text-on-navy absolute top-1 right-1 flex size-7 items-center justify-center rounded-full"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageDropzone onFiles={onAdd} />
        <p className="text-muted text-xs">
          These images are uploaded when you click Add project.
        </p>
      </CardContent>
    </Card>
  )
}

// === Form (data aane ke baad mount hota hai) =================================
function ItemForm({ section, portfolioId, item, fields: allFields, backTo, kind }) {
  const navigate = useNavigate()
  const scope = usePortfolioScope()
  const queryClient = useQueryClient()
  const config = SECTIONS[section]
  const resource = resources[section]
  const isEdit = Boolean(item)

  // Naye project ki gallery images (save se pehle)
  const [pending, setPending] = useState([])
  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])
  useEffect(
    () => () => pendingRef.current.forEach((it) => URL.revokeObjectURL(it.url)),
    [],
  )
  const addPending = (files) =>
    setPending((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ])
  const removePending = (it) => {
    URL.revokeObjectURL(it.url)
    setPending((prev) => prev.filter((x) => x !== it))
  }

  // Categories: "type" field (project / blog) form mein nahi dikhta, tab se khud set hota hai.
  // Same type mein same naam dobara nahi ban sakta.
  const isCategory = section === 'categories'
  const kindField = isCategory && kind ? findKindField(allFields) : null
  const isServices = section === 'services'
  const existing = useQuery({
    queryKey: resource.keys.list({ portfolio: portfolioId }),
    queryFn: () => resource.list({ portfolio: portfolioId }),
    enabled: isCategory || isServices,
  })
  const nameField = isCategory
    ? (allFields.find((f) => f.name === 'name') ??
      allFields.find((f) => f.type === 'text'))
    : null
  const norm = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase()
  const isDuplicate = (value) =>
    toList(existing.data).some(
      (c) =>
        c.id !== item?.id &&
        norm(c[nameField.name]) === norm(value) &&
        (!kindField || matchesKind(kindField, c, kind)),
    )
  // Services: sirf ek service "featured" ho sakti hai
  const otherFeatured = isServices
    ? toList(existing.data).find((c) => c.id !== item?.id && c.is_featured)
    : null
  const fields = allFields
    .filter((f) => f !== kindField)
    .map((f) => {
      if (f === nameField)
        return {
          ...f,
          validate: (v) =>
            !isDuplicate(v) || `This ${kind ? `${kind} ` : ''}category already exists.`,
        }
      if (isServices && f.type === 'checkbox' && /featur/i.test(f.name))
        return {
          ...f,
          validate: (v) =>
            !v ||
            !otherFeatured ||
            `Only one service can be featured. "${otherFeatured.title || otherFeatured.name}" is already featured. Turn it off there first.`,
        }
      return f
    })

  const defaults = Object.fromEntries(
    fields.map((f) => {
      const v = item?.[f.name]
      if (f.type === 'checkbox')
        return [f.name, item ? Boolean(v) : true === (f.name === 'is_visible')]
      if (f.type === 'relation')
        return [
          f.name,
          f.relation?.multiple
            ? (v ?? []).map((x) => x?.id ?? x)
            : String(v?.id ?? v ?? ''),
        ]
      if (f.type === 'datetime-local') return [f.name, v ? String(v).slice(0, 16) : '']
      return [f.name, v ?? (f.type === 'image' || f.type === 'file' ? null : '')]
    }),
  )

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: defaults })

  const save = useMutation({
    mutationFn: async (values) => {
      const extra = { portfolio: portfolioId }
      if (kindField) extra[kindField.name] = kindValue(kindField, kind)
      const payload = buildPayload(fields, values, extra, isEdit, item)
      const result = await (isEdit
        ? resource.update(item.id, payload)
        : resource.create(payload))
      let galleryFailed = false
      if (!isEdit && config.gallery && pending.length) {
        try {
          for (const it of pending)
            await galleryResource.create(
              toFormData({ project: result.id, image: it.file }),
            )
        } catch {
          galleryFailed = true
        }
      }
      return { result, galleryFailed }
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const { result, galleryFailed } = await save.mutateAsync(values)
      await queryClient.invalidateQueries({ queryKey: resource.keys.all })
      await queryClient.invalidateQueries({ queryKey: galleryResource.keys.all })
      if (galleryFailed) {
        notify.error(
          'Project saved, but some gallery images could not be uploaded. Add them here.',
        )
        navigate(scope.itemPath(portfolioId, section, result.id))
        return
      }
      notify.success(isEdit ? `${config.singular} updated.` : `${config.singular} added.`)
      navigate(backTo)
    } catch (error) {
      if (error?.errors)
        applyServerErrors(error, setError, { fields: fields.map((f) => f.name) })
      else notify.error(error)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={FULL.includes(field.type) ? 'sm:col-span-2' : undefined}
            >
              <FieldControl
                field={field}
                register={register}
                control={control}
                error={errors[field.name]?.message}
                portfolioId={portfolioId}
                kind={CATEGORY_KINDS[section]}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {config.gallery &&
        (isEdit ? (
          <ProjectGallery projectId={item.id} />
        ) : (
          <PendingGallery items={pending} onAdd={addPending} onRemove={removePending} />
        ))}

      <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border">
        <Button as={Link} to={backTo} variant="secondary" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : `Add ${config.singular.toLowerCase()}`}
        </Button>
      </div>
    </form>
  )
}

// === Page: /admin/portfolios/:id/edit/:section/(new | :itemId) ===============
export function PortfolioItemPage() {
  const { id: portfolioId, section, itemId } = useParams()
  const scope = usePortfolioScope()
  const [searchParams] = useSearchParams()
  const config = SECTIONS[section]
  const schema = useSectionSchema(section)
  const isEdit = Boolean(itemId) && itemId !== 'new'

  const itemQuery = useQuery({
    queryKey: config ? resources[section].keys.detail(itemId) : ['noop'],
    queryFn: () => resources[section].get(itemId),
    enabled: Boolean(config) && isEdit,
  })

  if (!config) return <Navigate to={scope.homePath(portfolioId)} replace />

  const step = ACADEMIC_TABS.includes(section) ? 3 : 4
  const kind = section === 'categories' ? searchParams.get('kind') : null
  const tab = kind && CATEGORY_TABS[kind] ? CATEGORY_TABS[kind] : section
  const backTo = scope.listPath(portfolioId, { step, tab })

  return (
    <>
      <PageHeader
        backTo={backTo}
        backLabel="Back to portfolio"
        title={`${isEdit ? 'Edit' : 'Add'} ${config.singular.toLowerCase()}`}
        description={
          kind
            ? `${kind.charAt(0).toUpperCase()}${kind.slice(1)} categories`
            : config.label
        }
      />
      {schema.isLoading || (isEdit && itemQuery.isLoading) ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
        </div>
      ) : isEdit && itemQuery.isError ? (
        <ErrorState error={itemQuery.error} onRetry={itemQuery.refetch} />
      ) : (
        <ItemForm
          key={itemQuery.data?.id ?? 'new'}
          section={section}
          portfolioId={Number(portfolioId)}
          item={isEdit ? itemQuery.data : null}
          fields={schema.fields ?? []}
          backTo={backTo}
          kind={kind}
        />
      )}
    </>
  )
}
