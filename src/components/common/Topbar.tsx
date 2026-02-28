import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  Moon,
  Sun,
  Monitor,
  Menu,
  Settings,
  LogOut,
  User,
  CheckCheck,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useSidebar } from '@/hooks/useSidebar'
import { getInitials, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

// ─── Mock notifications (replace with real Supabase query in Phase 7) ────────
const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'grade',      title: 'Grades published',    message: 'Term 1 grades for Form 3A are now available.', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), is_read: false },
  { id: '2', type: 'payment',    title: 'Payment received',    message: 'Invoice INV-2025-01042 has been paid in full.', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), is_read: false },
  { id: '3', type: 'attendance', title: 'Attendance alert',    message: '3 students absent in Form 4B today.', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), is_read: true },
]

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_ICONS: Record<ThemeMode, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const THEME_NEXT: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const THEME_LABEL: Record<ThemeMode, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
}

const NOTIF_TYPE_COLOR: Record<string, string> = {
  grade:        'bg-blue-500',
  payment:      'bg-emerald-500',
  attendance:   'bg-amber-500',
  announcement: 'bg-purple-500',
  message:      'bg-sky-500',
  system:       'bg-slate-500',
}

export function Topbar() {
  const { profile, role, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { openMobile } = useSidebar()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const ThemeIcon = THEME_ICONS[theme as ThemeMode] ?? Monitor
  const nextTheme = THEME_NEXT[theme as ThemeMode] ?? 'light'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">

      {/* ── Left: Mobile hamburger + Breadcrumbs ── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs — hidden on small mobile */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(nextTheme)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={THEME_LABEL[theme as ThemeMode]}
          aria-label={THEME_LABEL[theme as ThemeMode]}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <Separator />

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50',
                      !notif.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="mt-1 shrink-0">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          notif.is_read ? 'bg-transparent' : (NOTIF_TYPE_COLOR[notif.type] ?? 'bg-primary')
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('font-medium leading-tight', !notif.is_read && 'text-foreground')}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator />
            <div className="p-2">
              <Link
                to="/communication"
                className="flex w-full items-center justify-center rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                View all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {profile ? getInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="max-w-[120px] truncate text-sm font-medium leading-tight">
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="max-w-[120px] truncate text-[11px] capitalize text-muted-foreground">
                  {role?.replace(/_/g, ' ')}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="text-xs capitalize leading-none text-muted-foreground">
                  {role?.replace(/_/g, ' ')}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
