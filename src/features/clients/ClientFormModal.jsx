import { useForm, Controller } from 'react-hook-form'
import { Briefcase, Building2, Check, Mail, MapPin, Phone, User, X } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { applyServerErrors } from '@/api/errors'
import { toFormData } from '@/lib/formData'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'

const FIELDS = [
  'full_name',
  'email',
  'profession',
  'phone',
  'organization',
  'location',
  'photo',
]

const schema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  profession: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  location: z.string().trim().optional(),
  photo: z.any().optional(),
})

// File chuni gayi ho to multipart, warna normal JSON
function buildPayload({ photo, ...rest }) {
  return photo instanceof File ? toFormData({ ...rest, photo }) : rest
}

function ClientForm({ formId, client, onSubmit }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: client?.full_name ?? '',
      email: client?.email ?? '',
      profession: client?.profession ?? '',
      phone: client?.phone ?? '',
      organization: client?.organization ?? '',
      location: client?.location ?? '',
      photo: client?.photo ?? client?.profile_photo ?? null,
    },
  })

  const submit = async (values) => {
    try {
      await onSubmit(buildPayload(values))
    } catch (error) {
      // Non-validation errors ka toast useCrud dikha deta hai
      if (error?.errors) applyServerErrors(error, setError, { fields: FIELDS })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {errors.root?.server && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors.root.server.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-7">
        <div className="flex justify-center">
          <Controller
            name="photo"
            control={control}
            render={({ field }) => (
              <ImageUploader
                shape="circle-sm"
                label="Photo"
                showHint={false}
                value={field.value}
                onChange={field.onChange}
                className="flex flex-col items-center"
              />
            )}
          />
        </div>
        <div className="space-y-4">
          <FormField label="Full name" error={errors.full_name?.message} required>
            <Input icon={User} autoComplete="off" {...register('full_name')} />
          </FormField>
          <FormField label="Email" error={errors.email?.message} required>
            <Input icon={Mail} type="email" autoComplete="off" {...register('email')} />
          </FormField>
        </div>
      </div>

      <FormField label="Phone" error={errors.phone?.message}>
        <Input
          icon={Phone}
          type="tel"
          placeholder="+92 300 1234567"
          {...register('phone')}
        />
      </FormField>
      <FormField label="Profession" error={errors.profession?.message}>
        <Input icon={Briefcase} placeholder="Researcher" {...register('profession')} />
      </FormField>
      <FormField label="Organization" error={errors.organization?.message}>
        <Input
          icon={Building2}
          placeholder="University or institute"
          {...register('organization')}
        />
      </FormField>
      <FormField label="Location" error={errors.location?.message}>
        <Input icon={MapPin} placeholder="Lahore" {...register('location')} />
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
