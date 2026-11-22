import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { applyServerErrors } from '@/api/errors'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { notify } from '@/lib/notify'
import { buildPayload, resources, toList, useSectionSchema } from '../sections'
import { FieldControl } from './PortfolioItemPage'

// Contact details + Social links: ek hi tab, ek hi Save.
// - Contact: sirf ek record. Optional fields par "(optional)" likha hota hai.
// - Email aur notification email: koi ek bhara ho to doosri khud copy ho jati hai.
// - Social links: ek saath kai links add karo; Save par sab ek saath save hote hain.
const contactsApi = resources.contacts
const linksApi = resources['social-links']
const emptyLink = (fields) => ({
  key: crypto.randomUUID(),
  id: null,
  values: Object.fromEntries(
    fields.map((f) => [f.name, f.type === 'checkbox' ? false : '']),
  ),
  error: '',
})

const isBlank = (v) => v === '' || v === null || v === undefined || v === false

function LinkRow({ fields, row, index, onChange, onRemove }) {
  const set = (name, value) =>
    onChange({ ...row, values: { ...row.values, [name]: value }, error: '' })
  return (
    <div className="border-line bg-card space-y-3 rounded-xl border p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="text-heading text-sm font-medium">Link {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove link ${index + 1}`}
          className="hover:bg-danger/10 hover:text-danger"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const value = row.values[f.name] ?? ''
          const label = f.required ? f.label : `${f.label} (optional)`
          if (f.type === 'checkbox')
            return (
              <Checkbox
                key={f.name}
                label={f.label}
                checked={Boolean(value)}
                onChange={(e) => set(f.name, e.target.checked)}
              />
            )
          if (f.type === 'select')
            return (
              <FormField key={f.name} label={label} required={f.required}>
                <Select
                  placeholder="Select..."
                  value={value}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            )
          return (
            <FormField key={f.name} label={label} required={f.required}>
              <Input
                type={['url', 'email', 'number'].includes(f.type) ? f.type : 'text'}
                value={value}
                onChange={(e) => set(f.name, e.target.value)}
              />
            </FormField>
          )
        })}
      </div>
      {row.error && (
        <p role="alert" className="text-danger text-sm">
          {row.error}
        </p>
      )}
    </div>
  )
}

const messageOf = (error) => {
  const e = error?.errors
  if (e && typeof e === 'object')
    return Object.entries(e)
      .map(([k, v]) => `${k}: ${[].concat(v).join(' ')}`)
      .join(' · ')
  return error?.message || 'Could not save this link.'
}

function Editor({
  portfolioId,
  contact: initialContact,
  links,
  contactFields,
  linkFields,
}) {
  const queryClient = useQueryClient()
  const contactRef = useRef(initialContact) // pehli save par bana record, dubara save par update hota hai

  // --- contact: email <-> notification email ---
  const notifyField = contactFields.find(
    (f) => /notif/i.test(f.name) && /mail/i.test(f.name),
  )
  const mainEmail = contactFields.find(
    (f) => f.type === 'email' && f !== notifyField && /^e?-?mail$/i.test(f.name),
  )
  const paired = Boolean(notifyField && mainEmail)
  const eitherRequired = paired && (notifyField.required || mainEmail.required)

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: Object.fromEntries(
      contactFields.map((f) => [
        f.name,
        f.type === 'checkbox'
          ? Boolean(initialContact?.[f.name])
          : (initialContact?.[f.name] ?? ''),
      ]),
    ),
  })

  const shownContactFields = contactFields.map((f) => {
    const optional = !f.required && f.type !== 'checkbox'
    let field = { ...f, label: optional ? `${f.label} (optional)` : f.label }
    if (paired && (f === notifyField || f === mainEmail)) {
      const other = f === notifyField ? mainEmail : notifyField
      field = {
        ...field,
        label: eitherRequired ? f.label : `${f.label} (optional)`,
        required: false,
        hint: eitherRequired
          ? `Fill at least one of ${mainEmail.label} / ${notifyField.label}. The other is copied automatically.`
          : `Leave empty to use ${other.label.toLowerCase()}.`,
        validate: eitherRequired
          ? (v) => !isBlank(v) || !isBlank(getValues(other.name)) || 'Enter an email.'
          : undefined,
      }
    }
    return field
  })

  // --- social links ---
  const [rows, setRows] = useState(() =>
    links.length
      ? links.map((l) => ({
          key: String(l.id),
          id: l.id,
          values: Object.fromEntries(
            linkFields.map((f) => [
              f.name,
              f.type === 'checkbox' ? Boolean(l[f.name]) : (l[f.name] ?? ''),
            ]),
          ),
          original: l,
          error: '',
        }))
      : [],
  )
  const [removed, setRemoved] = useState([]) // purani rows jo hatayi gayi
  const [saving, setSaving] = useState(false)

  const touched = (row) =>
    linkFields.some((f) => f.type !== 'checkbox' && !isBlank(row.values[f.name]))

  const saveAll = handleSubmit(async (values) => {
    // 1) links validate
    const missing = (row) =>
      linkFields.find(
        (f) => f.required && f.type !== 'checkbox' && isBlank(row.values[f.name]),
      )
    let invalid = false
    const checked = rows.map((row) => {
      if (!row.id && !touched(row)) return row
      const m = missing(row)
      if (m) {
        invalid = true
        return { ...row, error: `${m.label} is required.` }
      }
      return row
    })
    if (invalid) {
      setRows(checked)
      notify.error('Fix the highlighted links first.')
      return
    }

    setSaving(true)
    try {
      // 2) contact (email <-> notification email)
      const data = { ...values }
      if (paired) {
        if (isBlank(data[mainEmail.name])) data[mainEmail.name] = data[notifyField.name]
        if (isBlank(data[notifyField.name])) data[notifyField.name] = data[mainEmail.name]
      }
      const current = contactRef.current
      const payload = buildPayload(
        contactFields,
        data,
        { portfolio: portfolioId },
        Boolean(current),
        current,
      )
      try {
        contactRef.current = current
          ? await contactsApi.update(current.id, payload)
          : await contactsApi.create(payload)
      } catch (error) {
        if (error?.errors)
          applyServerErrors(error, setError, { fields: contactFields.map((f) => f.name) })
        else notify.error(error)
        return
      }

      // 3) links: sab ek saath (parallel)
      const jobs = [
        ...removed.map((id) => ({ type: 'delete', id })),
        ...checked
          .filter((r) => r.id || touched(r))
          .map((r) => ({ type: r.id ? 'update' : 'create', row: r })),
      ]
      const results = await Promise.allSettled(
        jobs.map((job) => {
          if (job.type === 'delete') return linksApi.remove(job.id)
          const payload = buildPayload(
            linkFields,
            job.row.values,
            { portfolio: portfolioId },
            job.type === 'update',
            job.row.original,
          )
          return job.type === 'update'
            ? linksApi.update(job.row.id, payload)
            : linksApi.create(payload)
        }),
      )

      let failed = 0
      const failedRemovals = []
      const nextRows = checked
        .filter((r) => r.id || touched(r))
        .map((row) => ({ ...row }))
      results.forEach((res, i) => {
        const job = jobs[i]
        if (job.type === 'delete') {
          if (res.status === 'rejected') {
            failed += 1
            failedRemovals.push(job.id)
          }
          return
        }
        const target = nextRows.find((r) => r.key === job.row.key)
        if (res.status === 'fulfilled') {
          target.id = res.value.id
          target.original = res.value
          target.error = ''
        } else {
          failed += 1
          target.error = messageOf(res.reason)
        }
      })
      setRows(nextRows)
      setRemoved(failedRemovals)
      await queryClient.invalidateQueries({ queryKey: contactsApi.keys.all })
      await queryClient.invalidateQueries({ queryKey: linksApi.keys.all })
      if (failed)
        notify.error(`${failed} link(s) could not be saved. See the messages below.`)
      else notify.success('Contact details and links saved.')
    } finally {
      setSaving(false)
    }
  })

  const addRow = () => setRows((prev) => [...prev, emptyLink(linkFields)])
  const updateRow = (key, next) =>
    setRows((prev) => prev.map((r) => (r.key === key ? next : r)))
  const removeRow = (row) => {
    if (row.id) setRemoved((prev) => [...prev, row.id])
    setRows((prev) => prev.filter((r) => r.key !== row.key))
  }

  return (
    // <form> nahi: wizard khud ek <form> ke andar hai (nested form kaam nahi karta)
    <div
      className="space-y-6"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault()
      }}
    >
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <Card>
        <CardHeader
          title="Contact details"
          description="Shown on the Contact page and footer. Fields marked (optional) can stay empty."
        />
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {shownContactFields.map((field) => (
            <div
              key={field.name}
              className={
                ['textarea', 'rich', 'image', 'file', 'checkbox'].includes(field.type)
                  ? 'sm:col-span-2'
                  : undefined
              }
            >
              <FieldControl
                field={field}
                register={register}
                control={control}
                error={errors[field.name]?.message}
                portfolioId={portfolioId}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Social links"
          description="Add as many as you need, then save everything together."
        />
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState
              title="No links yet"
              description="Add LinkedIn, Google Scholar, GitHub or any other profile."
              action={
                <Button type="button" onClick={addRow}>
                  <Plus className="size-4" /> Add link
                </Button>
              }
            />
          ) : (
            <>
              {rows.map((row, i) => (
                <LinkRow
                  key={row.key}
                  fields={linkFields}
                  row={row}
                  index={i}
                  onChange={(next) => updateRow(row.key, next)}
                  onRemove={() => removeRow(row)}
                />
              ))}
              <Button type="button" variant="secondary" onClick={addRow}>
                <Plus className="size-4" /> Add another link
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={saveAll} loading={saving}>
          Save contact & links
        </Button>
      </div>
    </div>
  )
}

export function ContactLinks({ portfolioId }) {
  const contactSchema = useSectionSchema('contacts')
  const linkSchema = useSectionSchema('social-links')
  const params = { portfolio: portfolioId }
  const contactQuery = useQuery({
    queryKey: contactsApi.keys.list(params),
    queryFn: () => contactsApi.list(params),
  })
  const linksQuery = useQuery({
    queryKey: linksApi.keys.list(params),
    queryFn: () => linksApi.list(params),
  })

  if (
    contactSchema.isLoading ||
    linkSchema.isLoading ||
    contactQuery.isLoading ||
    linksQuery.isLoading
  )
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  if (contactQuery.isError || linksQuery.isError)
    return (
      <EmptyState
        title="Could not load contact details"
        description={(contactQuery.error ?? linksQuery.error)?.message}
        action={
          <Button
            onClick={() => {
              contactQuery.refetch()
              linksQuery.refetch()
            }}
          >
            Try again
          </Button>
        }
      />
    )

  return (
    <Editor
      portfolioId={portfolioId}
      contact={toList(contactQuery.data)[0] ?? null}
      links={toList(linksQuery.data)}
      contactFields={contactSchema.fields ?? []}
      linkFields={linkSchema.fields ?? []}
    />
  )
}
