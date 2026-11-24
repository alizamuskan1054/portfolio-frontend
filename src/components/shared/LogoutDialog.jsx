import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

// Logout se pehle confirmation
export function LogoutDialog({ open, onClose, onConfirm, loading }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Log out?"
      description="You will need to sign in again to access your account."
      confirmLabel="Log out"
    />
  )
}
