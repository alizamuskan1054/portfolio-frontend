import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react'
import { clientsResource } from '@/api/endpoints'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { notify } from '@/lib/notify'
import { portalApi } from '@/portal/api'

const PORTAL_STATUS = {
  not_invited: { variant: 'neutral', label: 'Not invited' },
  invited: { variant: 'warning', label: 'Invite pending' },
  active: { variant: 'success', label: 'Active' },
  disabled: { variant: 'danger', label: 'Access disabled' },
}

// Client detail page par: client ko portal ka invite bhejo, link copy karo.
export function PortalAccessCard({ client }) {
  const queryClient = useQueryClient()
  const [result, setResult] = useState(null) // { invite_url, email_sent }

  const status = PORTAL_STATUS[client.portal_status]
  const hasEmail = Boolean(client.email)
  const invited = client.portal_status === 'invited'
  const active = client.portal_status === 'active'

  const invite = useMutation({
    mutationFn: () => portalApi.inviteClient(client.id),
    onSuccess: (data) => {
      setResult(data)
      notify.success(
        data?.email_sent ? 'Invite sent to the client.' : 'Invite link created.',
      )
      return queryClient.invalidateQueries({ queryKey: clientsResource.keys.all })
    },
    onError: (e) => notify.error(e),
  })

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex items-center gap-3">
            <h3 className="text-lg">Portal access</h3>
            {status && (
              <Badge variant={status.variant} dot>
                {status.label}
              </Badge>
            )}
          </div>
          <p className="text-muted mt-0.5 text-sm">
            {!hasEmail
              ? 'Add an email address to this client first. The invite is sent there.'
              : active
                ? 'This client already has an account. Send a new invite only if they lost access.'
                : 'Let this client log in and manage their own portfolios.'}
          </p>
        </div>

        {result?.invite_url && (
          <div className="border-line bg-surface flex min-w-0 flex-[2] basis-80 items-center gap-2 rounded-xl border p-2">
            {result.email_sent ? (
              <p className="text-success flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 className="size-4" /> Sent to {result.sent_to || client.email}
              </p>
            ) : (
              <AlertTriangle
                className="text-warning size-4 shrink-0"
                aria-label="Email could not be sent. Copy the link and send it yourself."
              />
            )}
            <Input
              readOnly
              value={result.invite_url}
              aria-label="Invite link"
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 text-xs"
            />
            <CopyButton text={result.invite_url} variant="secondary" />
          </div>
        )}

        {hasEmail && (
          <Button
            variant={invited || active ? 'secondary' : 'primary'}
            onClick={() => invite.mutate()}
            loading={invite.isPending}
          >
            <Send className="size-4" />
            {invited || active ? 'Resend invite' : 'Send invite'}
          </Button>
        )}
      </div>
    </Card>
  )
}
