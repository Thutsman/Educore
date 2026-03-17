import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Banknote,
  MessageSquare,
  UserCog,
  Package,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  BookMarked,
  CalendarDays,
  FileQuestion,
  ClipboardList,
  FolderOpen,
  MessageCircle,
  FileText,
  LineChart,
  ShieldCheck,
  Settings2,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/hooks/useSidebar'
import { getInitials } from '@/utils/format'
import { SchoolSwitcher } from '@/components/common/SchoolSwitcher'
import type { AppRole } from '@/types'

// ─── Nav structure ──────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  allowedRoles: AppRole[]
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      {
        label: 'Admin Panel',
        icon: ShieldCheck,
        href: '/admin',
        allowedRoles: ['super_admin'],
      },
    ],
  },
  {
    label: 'Setup',
    items: [
      {
        label: 'School Setup',
        icon: Settings2,
        href: '/dashboard/admin',
        allowedRoles: ['school_admin'],
      },
    ],
  },
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        allowedRoles: ['headmaster','deputy_headmaster','bursar','hod','class_teacher','teacher','non_teaching_staff','parent','student'],
      },
    ],
  },
  {
    label: 'Academic',
    items: [
      {
        label: 'Students',
        icon: GraduationCap,
        href: '/students',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher'],
      },
      {
        label: 'Academics',
        icon: BookOpen,
        href: '/academics',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher'],
      },
      {
        label: 'Scheme Book',
        icon: BookMarked,
        href: '/scheme-book',
        allowedRoles: ['headmaster','deputy_headmaster','hod','teacher'],
      },
      {
        label: 'Lesson Plans',
        icon: CalendarDays,
        href: '/lesson-plans',
        allowedRoles: ['headmaster','deputy_headmaster','hod','teacher'],
      },
      {
        label: 'Assignments',
        icon: FileQuestion,
        href: '/assignments',
        allowedRoles: ['headmaster','deputy_headmaster','hod','teacher'],
      },
      {
        label: 'Assessments',
        icon: ClipboardList,
        href: '/assessments',
        allowedRoles: ['headmaster','deputy_headmaster','hod','teacher'],
      },
      {
        label: 'Resources',
        icon: FolderOpen,
        href: '/resources',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','hod','teacher'],
      },
      {
        label: 'Attendance',
        icon: ClipboardCheck,
        href: '/attendance',
        allowedRoles: ['headmaster','deputy_headmaster','hod','class_teacher','teacher'],
      },
      {
        label: 'Timetable',
        icon: Clock,
        href: '/timetable',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Finance',
        icon: Banknote,
        href: '/finance',
        allowedRoles: ['headmaster','deputy_headmaster','bursar'],
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        label: 'Messages',
        icon: MessageSquare,
        href: '/communication',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','bursar','hod','class_teacher','teacher','non_teaching_staff','parent','student'],
      },
      {
        label: 'Parent Messages',
        icon: MessageCircle,
        href: '/parent-messages',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','hod','class_teacher'],
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        label: 'Term Reports',
        icon: FileText,
        href: '/reports',
        allowedRoles: ['headmaster','deputy_headmaster','hod','class_teacher'],
      },
      {
        label: 'Class Analytics',
        icon: LineChart,
        href: '/class-analytics',
        allowedRoles: ['headmaster','deputy_headmaster','hod','class_teacher'],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Staff',
        icon: UserCog,
        href: '/staff',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster'],
      },
      {
        label: 'Assets',
        icon: Package,
        href: '/assets',
        allowedRoles: ['school_admin','headmaster','deputy_headmaster','non_teaching_staff'],
      },
    ],
  },
]

// ─── Single nav item ─────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem
  collapsed: boolean
  onClick?: () => void
}) {
  const location = useLocation()
  const isActive =
    item.href === '/dashboard'
      ? location.pathname.startsWith('/dashboard')
      : location.pathname.startsWith(item.href)

  const linkContent = (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        'relative',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
      )}
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
        )}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </NavLink>
  )

  if (!collapsed) return linkContent

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Core sidebar content ────────────────────────────────────────────────────

function SidebarContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean
  onNavClick?: () => void
}) {
  const { role, roles, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { toggleCollapsed } = useSidebar()

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => roles.length > 0 && item.allowedRoles.some(r => roles.includes(r))),
  })).filter(group => group.items.length > 0)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground shadow-[4px_0_24px_-4px_rgba(0,0,0,0.15)]">

        {/* ── Logo ── */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
            collapsed ? 'justify-center px-2' : 'gap-3'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight tracking-tight">
                Educore
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">
                ISMS
              </span>
            </div>
          )}
        </div>

        {/* ── School Switcher ── */}
        <div className="px-2 py-1">
          <SchoolSwitcher collapsed={collapsed} />
        </div>
        <Separator className="bg-sidebar-border" />

        {/* ── Navigation ── */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-4 px-2">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                {/* Group label */}
                {!collapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                    {group.label}
                  </p>
                )}
                {collapsed && (
                  <div className="my-1 flex justify-center">
                    <div className="h-px w-6 bg-sidebar-border" />
                  </div>
                )}

                {/* Nav items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      collapsed={collapsed}
                      onClick={onNavClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* ── Bottom section ── */}
        <div className="shrink-0 border-t border-sidebar-border">
          {/* Settings */}
          <div className="px-2 pt-2">
            <SidebarNavItem
              item={{
                label: 'Settings',
                icon: Settings,
                href: '/settings',
                allowedRoles: ['school_admin','headmaster','deputy_headmaster','bursar','hod','class_teacher','teacher','non_teaching_staff','parent','student'],
              }}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          </div>

          <Separator className="my-2 bg-sidebar-border" />

          {/* User card */}
          <div
            className={cn(
              'flex items-center px-3 pb-3',
              collapsed ? 'flex-col gap-2' : 'gap-3'
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-emerald-600/90 text-xs font-semibold text-white">
                {profile ? getInitials(profile.full_name) : '?'}
              </AvatarFallback>
            </Avatar>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="truncate text-xs capitalize text-sidebar-foreground/50">
                  {role?.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            )}

            {collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'absolute -right-3 top-20 flex h-6 w-6 items-center justify-center',
              'rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm',
              'transition-colors hover:bg-sidebar-accent',
              'hidden lg:flex'
            )}
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronLeft className="h-3 w-3" />
            }
          </button>
        </div>

      </div>
    </TooltipProvider>
  )
}

// ─── Exported Sidebar (desktop + mobile) ────────────────────────────────────

export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'relative hidden h-full shrink-0 transition-all duration-300 ease-in-out lg:block',
          collapsed ? 'w-[60px]' : 'w-[220px]'
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ── Mobile sidebar (Sheet drawer) ── */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent
          side="left"
          className="w-[220px] p-0 [&>button]:hidden"
        >
          <div className="relative h-full">
            <SidebarContent collapsed={false} onNavClick={closeMobile} />
            {/* Close button */}
            <button
              onClick={closeMobile}
              className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
