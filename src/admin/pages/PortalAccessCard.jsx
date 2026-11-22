import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react'
import { clientsResource } from '@/api/endpoints'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
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
    <Card className="h-fit">
      <CardHeader
        title="Portal access"
        description="Let this client log in and manage their own portfolios."
        action={
          status && (
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
          )
        }
      />
      <CardContent className="space-y-4">
        {!hasEmail ? (
          <p className="text-muted text-sm">
            Add an email address to this client first. The invite is sent there.
          </p>
        ) : (
          <>
            {active && (
              <p className="text-muted flex items-start gap-2 text-sm">
                <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                This client already has an account. Send a new invite only if they lost
                access.
              </p>
            )}
            <Button
              variant={invited || active ? 'secondary' : 'primary'}
              className="w-full"
              onClick={() => invite.mutate()}
              loading={invite.isPending}
            >
              <Send className="size-4" />
              {invited || active ? 'Resend invite' : 'Send invite'}
            </Button>
          </>
        )}

        {result?.invite_url && (
          <div className="border-line bg-surface space-y-2 rounded-xl border p-3">
            {result.email_sent ? (
              <p className="text-success flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4" /> Email sent to{' '}
                {result.sent_to || client.email}
              </p>
            ) : (
              <p className="text-warning flex items-start gap-2 text-sm font-medium">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Email could not be sent. Copy this link and send it to the client
                yourself.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={result.invite_url}
                aria-label="Invite link"
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 text-xs"
              />
              <CopyButton text={result.invite_url} variant="secondary" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
