// DEV-ONLY showcase: /dev/ui (production build mein route nahi hota).
import { useState } from 'react'
import { Eye, Mail, Pencil, Plus, Settings, Trash2 } from 'lucide-react'
import { useTheme } from '@/theme/theme-context'
import { notify } from '@/lib/notify'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { FilterTabs, Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormField } from '@/components/shared/FormField'

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  )
}

export default function UiKitPage() {
  const { theme, setTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [switchOn, setSwitchOn] = useState(true)
  const [filter, setFilter] = useState('all')

  const fakeDelete = () => {
    setConfirmLoading(true)
    setTimeout(() => {
      setConfirmLoading(false)
      setConfirmOpen(false)
      notify.success('Deleted (demo)')
    }, 1200)
  }

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl">UI Kit</h1>
          <p className="text-muted">Dev-only page. Light aur Dark dono mein check karein.</p>
        </div>
        <div className="flex gap-2">
          {['light', 'dark', 'system'].map((t) => (
            <Button key={t} size="sm" variant={theme === t ? 'primary' : 'secondary'} onClick={() => setTheme(t)}>
              {t}
            </Button>
          ))}
        </div>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="secondary" aria-label="Add"><Plus className="size-4" /></Button>
          <Button size="icon-sm" variant="ghost" aria-label="Edit"><Pencil className="size-4" /></Button>
          <Button><Plus className="size-4" /> With icon</Button>
        </div>
      </Section>

      <Section title="Form controls">
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" required hint="As it appears on the portfolio.">
              <Input placeholder="Dr. Ahmad" />
            </FormField>
            <FormField label="Email" error="Enter a valid email address.">
              <Input type="email" defaultValue="not-an-email" />
            </FormField>
            <FormField label="Password">
              <PasswordInput placeholder="Show / hide test" />
            </FormField>
            <FormField label="Inquiry type">
              <Select placeholder="Select type">
                <option value="collaboration">Collaboration</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Biography" className="sm:col-span-2">
              <Textarea placeholder="Write something..." />
            </FormField>
            <Checkbox label="Remember me" description="Keep me signed in on this device." />
            <Switch
              checked={switchOn}
              onChange={setSwitchOn}
              label="Show Blogs page"
              description="Hidden pages keep their data."
            />
            <FormField label="Disabled">
              <Input disabled value="Cannot edit" readOnly />
            </FormField>
          </CardContent>
        </Card>
      </Section>

      <Section title="Badges and Avatars">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success" dot>Published</Badge>
          <Badge variant="warning" dot>Draft</Badge>
          <Badge variant="danger" dot>Unpublished</Badge>
          <Badge variant="accent">Featured</Badge>
          <Badge variant="primary" size="sm">Small</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name="Dr. Ahmad" size="sm" />
          <Avatar name="Dr. Ahmad" />
          <Avatar name="Sara Khan" size="lg" />
          <Avatar name="Ali" src="https://broken.invalid/x.png" size="xl" />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader
              title="Card with header"
              description="Description line"
              action={<Button size="sm" variant="secondary">Action</Button>}
            />
            <CardContent>Body content goes here.</CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">Cancel</Button>
              <Button size="sm">Save</Button>
            </CardFooter>
          </Card>
          <Card hoverable>
            <CardContent>
              <p className="font-medium text-heading">Hoverable card</p>
              <p className="mt-1 text-sm text-muted">Hover karein: border blue hoti hai.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs
          keepMounted
          items={[
            { key: 'edu', label: 'Education', icon: Eye, badge: 2, content: <p>Education entries...</p> },
            { key: 'exp', label: 'Experience', content: <p>Experience entries...</p> },
            { key: 'awards', label: 'Awards', content: <p>Awards entries...</p> },
          ]}
        />
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: 8 },
            { value: 'published', label: 'Published', count: 5 },
            { value: 'draft', label: 'Draft', count: 3 },
          ]}
        />
      </Section>

      <Section title="Dropdown, Modal, Confirm, Toast">
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => notify.info('Edit clicked') },
              { label: 'Preview', icon: Eye, onClick: () => notify.info('Preview clicked') },
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirmOpen(true) },
            ]}
          />
          <DropdownMenu
            trigger={<Button variant="secondary"><Settings className="size-4" /> Menu</Button>}
            align="start"
            items={[
              { label: 'Mail', icon: Mail, onClick: () => notify.info('Mail') },
              { label: 'Disabled', disabled: true },
            ]}
          />
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Confirm dialog</Button>
          <Button variant="soft" onClick={() => notify.success('Saved successfully')}>Success toast</Button>
          <Button variant="soft" onClick={() => notify.error('Validation failed.')}>Error toast</Button>
        </div>
      </Section>

      <Section title="Loading states">
        <div className="flex items-center gap-4">
          <Spinner className="size-8" />
          <div className="w-64 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add client"
        description="Fill in the details below."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setModalOpen(false); notify.success('Client added (demo)') }}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Full name" required><Input /></FormField>
          <FormField label="Email" required><Input type="email" /></FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={fakeDelete}
        loading={confirmLoading}
        title="Delete client?"
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </main>
  )
}
