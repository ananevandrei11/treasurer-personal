import { AppNavLinks } from './AppNavLinks'
import { UserMenu } from './UserMenu'

type Props = { email: string }

export function AppHeader({ email }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight">💰 Treasurer</span>
          <AppNavLinks />
        </div>
        <UserMenu email={email} />
      </div>
    </header>
  )
}
