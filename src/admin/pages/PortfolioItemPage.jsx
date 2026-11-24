import { cloneElement, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Trash2 } from 'lucide-react'
import { inferFieldIcon, prettyLabel } from '@/components/shared/field-icons'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { FileUploader, ImageDropzone } from '@/components/shared/FileUploader'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { toFormData } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
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

// Lambi likhai wale fields hi textarea bante hain; Degree, Institution jaise short fields
// (backend mein TextField hon tab bhi) ek line ke input rehte hain.
const LONG_TEXT =
  /description|biograph|\bbio\b|summary|abstract|details|content|about|message|notes?|achievement|responsib|overview|objective|body/i
const YEAR_FIELD = /year/i
const YEARS = Array.from({ length: new Date().getFullYear() + 6 - 1899 }, (_, i) => {
  return new Date().getFullYear() + 6 - i
})

// Ek row mein aane wale fields (naam se). Jo field maujood na ho to row normal ban jati hai.
const GROUPS = [
  ['published_at', 'reading_time'],
  ['status', 'category'],
  ['doi', 'external_url'],
]

// Start/End jodi (start_year + end_year...) aur GROUPS ek hi row mein
function groupFields(fields) {
  const used = new Set()
  const rows = []
  for (const f of fields) {
    if (used.has(f.name)) continue
    const m = /^start_(.+)$/.exec(f.name)
    const end = m && fields.find((x) => x.name === `end_${m[1]}`)
    if (end) {
      used.add(end.name)
      rows.push({ pair: [f, end] })
      continue
    }
    const group = GROUPS.find(
      (g) => g.includes(f.name) && g.every((n) => fields.some((x) => x.name === n)),
    )
    if (group) {
      const members = group.map((n) => fields.find((x) => x.name === n))
      members.forEach((x) => used.add(x.name))
      rows.push({ group: members })
    } else rows.push({ field: f })
  }
  // Tarteeb: year/date + toggles, phir status+category, phir title, baqi pehle jaisa
  const rank = (row) => {
    const names = row.group
      ? row.group.map((x) => x.name)
      : row.field
        ? [row.field.name]
        : []
    if (names.some((n) => n === 'year' || n === 'published_at')) return 0
    if (names.some((n) => n === 'status' || n === 'category')) return 1
    if (names.includes('title')) return 2
    return 3
  }
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row) - rank(b.row) || a.index - b.index)
    .map(({ row }) => row)
}

// FormField child ko id/invalid props deta hai; yeh wrapper unhein DOM tak nahi bhejta
function PairBody({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

// Bina label ke control + hint/error (row ke andar inline fields ke liye)
function BareWrap({ hint, error, children }) {
  return (
    <div className="min-w-0 space-y-1">
      {children}
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted text-xs">{hint}</p>
      )}
    </div>
  )
}

// Input ke saath usi row mein (jaise Year ke saath Featured / Visible)
function InlineWith({ extra, children, ...inputProps }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-44 flex-1">{cloneElement(children, inputProps)}</div>
      {extra}
    </div>
  )
}

// Ek row mein kai fields: pehle ka label left, baqi ka label apne input se pehle
function GroupRow({ fields, extra, register, control, errors, portfolioId, kind }) {
  const [first, ...others] = fields
  const common = { register, control, portfolioId, kind, bare: true }
  return (
    <FormField label={first.label} required={first.required}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-44 flex-1">
          <FieldControl field={first} error={errors[first.name]?.message} {...common} />
        </div>
        {others.map((f) => {
          const Icon = inferFieldIcon(f.label)
          return (
            <div key={f.name} className="flex min-w-56 flex-1 items-start gap-3">
              <span className="text-heading flex h-10 shrink-0 items-center gap-2 text-sm font-medium">
                <Icon aria-hidden="true" className="size-4" />
                {prettyLabel(f.label)}
              </span>
              <div className="min-w-0 flex-1">
                <FieldControl field={f} error={errors[f.name]?.message} {...common} />
              </div>
            </div>
          )
        })}
        {extra}
      </div>
    </FormField>
  )
}

// Chhota on/off button (Featured, Visible, Current...). On hone par hara.
function ToggleChip({ field, control }) {
  const title = field.label.replace(/^is\s+/i, '').replace(/^./, (c) => c.toUpperCase())
  return (
    <Controller
      name={field.name}
      control={control}
      rules={field.validate ? { validate: field.validate } : undefined}
      render={({ field: f }) => (
        <div
          title={field.hint || undefined}
          className={cn(
            'inline-flex h-10 items-center gap-2.5 rounded-xl border px-3.5 text-sm font-medium transition-colors',
            f.value
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-line bg-background text-heading',
          )}
        >
          {title}
          <Switch checked={Boolean(f.value)} onChange={f.onChange} />
        </div>
      )}
    />
  )
}

// Related field (jaise Category): dropdown / checkboxes, options isi portfolio ki related entries se
function RelationControl({ field, register, control, error, portfolioId, kind, bare }) {
  const { name, label, required, relation } = field
  const resource = resources[relation.path]
  const scope = usePortfolioScope()
  const query = useQuery({
    queryKey: resource.keys.list({ portfolio: portfolioId, page_size: 100 }),
    queryFn: () => resource.list({ portfolio: portfolioId, page_size: 100 }),
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

  // bare: label ke baghair (jab field kisi row ke andar inline ho)
  const Wrap = bare ? BareWrap : FormField
  const wrapProps = bare ? { hint, error } : { label, required, hint, error }

  if (relation.multiple) {
    return (
      <Wrap {...wrapProps}>
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
      </Wrap>
    )
  }

  return (
    <Wrap {...wrapProps}>
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
    </Wrap>
  )
}

// === Ek field ===============================================================
export function FieldControl({
  field,
  register,
  control,
  error,
  portfolioId,
  kind,
  bare = false,
  miniLabel,
  extra,
}) {
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
        bare={bare}
      />
    )

  if (type === 'checkbox')
    return (
      <div className="space-y-1.5">
        <ToggleChip field={field} control={control} />
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
  if (type === 'textarea' && LONG_TEXT.test(`${label} ${name}`))
    input = <Textarea rows={4} {...register(name, rules)} />
  else if (type === 'textarea') input = <Input type="text" {...register(name, rules)} />
  else if (type === 'number' && YEAR_FIELD.test(`${label} ${name}`))
    input = (
      <Select placeholder={`Select ${label.toLowerCase()}`} {...register(name, rules)}>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    )
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

  if (bare)
    return (
      <div className="min-w-0 space-y-1">
        {miniLabel && (
          <span className="text-muted block text-xs font-medium">{miniLabel}</span>
        )}
        {input}
        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : (
          hint && <p className="text-muted text-xs">{hint}</p>
        )}
      </div>
    )

  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      {extra ? <InlineWith extra={extra}>{input}</InlineWith> : input}
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
    <div className="space-y-3">
      <p className="text-heading font-medium">Gallery</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
              className="bg-danger text-on-danger absolute top-1 right-1 flex size-7 items-center justify-center rounded-full shadow"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <ImageDropzone onFiles={(files) => upload.mutate(files)} busy={upload.isPending} />
    </div>
  )
}

// Naye project par: images pehle yahin chuno, project save hote hi upload ho jati hain
function PendingGallery({ items, onAdd, onRemove }) {
  return (
    <div className="space-y-3">
      <p className="text-heading font-medium">Gallery</p>
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                className="bg-danger text-on-danger absolute top-1 right-1 flex size-7 items-center justify-center rounded-full shadow"
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
    </div>
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
    queryKey: resource.keys.list({ portfolio: portfolioId, page_size: 100 }),
    queryFn: () => resource.list({ portfolio: portfolioId, page_size: 100 }),
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

  // Layout: toggles chhote chips ban kar pehle simple field ki row mein, image/file fields
  // gallery ke saath ek hi card mein side by side.
  const toggleFields = fields.filter((f) => f.type === 'checkbox')
  const mediaFields = fields.filter((f) => f.type === 'image' || f.type === 'file')
  const formFields = fields.filter(
    (f) => !toggleFields.includes(f) && !mediaFields.includes(f),
  )
  const rows = groupFields(formFields)
  const SIMPLE = ['text', 'number', 'select', 'date', 'email', 'url', 'tel']
  // Toggles (Featured / Visible) pehli row mein: year / published_at wali, warna pehla simple field
  const hostRow =
    toggleFields.length > 0
      ? rows.find((row) => row.group || row.field?.name === 'year') ||
        rows.find(
          (row) =>
            row.field &&
            SIMPLE.includes(row.field.type) &&
            !LONG_TEXT.test(`${row.field.label} ${row.field.name}`),
        )
      : undefined
  const toggleChips =
    toggleFields.length > 0 ? (
      <>
        {toggleFields.map((f) => (
          <ToggleChip key={f.name} field={f} control={control} />
        ))}
        {toggleFields.map(
          (f) =>
            errors[f.name]?.message && (
              <p key={f.name} role="alert" className="text-danger basis-full text-xs">
                {errors[f.name].message}
              </p>
            ),
        )}
      </>
    ) : null

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4">
          {rows.map((row) =>
            row.pair ? (
              <FormField
                key={row.pair[0].name}
                label="Duration"
                icon={CalendarDays}
                required={row.pair[0].required}
              >
                <PairBody>
                  {row.pair.map((f, i) => (
                    <FieldControl
                      key={f.name}
                      field={f}
                      register={register}
                      control={control}
                      error={errors[f.name]?.message}
                      bare
                      miniLabel={i === 0 ? 'From' : 'To'}
                    />
                  ))}
                </PairBody>
              </FormField>
            ) : row.group ? (
              <GroupRow
                key={row.group[0].name}
                fields={row.group}
                extra={row === hostRow ? toggleChips : undefined}
                register={register}
                control={control}
                errors={errors}
                portfolioId={portfolioId}
                kind={CATEGORY_KINDS[section]}
              />
            ) : (
              <div key={row.field.name}>
                <FieldControl
                  field={row.field}
                  register={register}
                  control={control}
                  error={errors[row.field.name]?.message}
                  portfolioId={portfolioId}
                  kind={CATEGORY_KINDS[section]}
                  extra={row === hostRow ? toggleChips : undefined}
                />
              </div>
            ),
          )}
          {!hostRow && toggleChips && (
            <div className="flex flex-wrap gap-3">{toggleChips}</div>
          )}
        </CardContent>
      </Card>

      {(mediaFields.length > 0 || config.gallery) && (
        <Card>
          <CardContent
            className={cn(
              'grid gap-6',
              mediaFields.length > 0 &&
                config.gallery &&
                'lg:grid-cols-[auto_minmax(0,1fr)]',
            )}
          >
            {mediaFields.length > 0 && (
              <div className="space-y-5">
                {mediaFields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    register={register}
                    control={control}
                    error={errors[field.name]?.message}
                    portfolioId={portfolioId}
                  />
                ))}
              </div>
            )}
            {config.gallery &&
              (isEdit ? (
                <ProjectGallery projectId={item.id} />
              ) : (
                <PendingGallery
                  items={pending}
                  onAdd={addPending}
                  onRemove={removePending}
                />
              ))}
          </CardContent>
        </Card>
      )}

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
          kind ? `${kind.charAt(0).toUpperCase()}${kind.slice(1)} categories` : undefined
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
