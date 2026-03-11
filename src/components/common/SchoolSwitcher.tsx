import { School, ChevronDown, Check } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { useSchool } from '@/context/SchoolContext'

interface SchoolSwitcherProps {
  collapsed: boolean
}

export function SchoolSwitcher({ collapsed }: SchoolSwitcherProps) {
  const { schools, currentSchool, setCurrentSchool } = useSchool()

  if (!currentSchool) return null

  const trigger = (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors',
        schools.length > 1 && 'cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <School className="h-4 w-4 shrink-0 text-emerald-500" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-xs font-medium">{currentSchool.name}</span>
          {schools.length > 1 && <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />}
        </>
      )}
    </div>
  )

  if (schools.length <= 1) {
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {currentSchool.name}
          </TooltipContent>
        </Tooltip>
      )
    }
    return trigger
  }

  const dropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-52">
        {schools.map((school) => (
          <DropdownMenuItem
            key={school.id}
            onClick={() => setCurrentSchool(school)}
            className="flex items-center gap-2"
          >
            <School className="h-4 w-4 text-emerald-500" />
            <span className="flex-1 truncate">{school.name}</span>
            {school.id === currentSchool.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-52">
                {schools.map((school) => (
                  <DropdownMenuItem
                    key={school.id}
                    onClick={() => setCurrentSchool(school)}
                    className="flex items-center gap-2"
                  >
                    <School className="h-4 w-4 text-emerald-500" />
                    <span className="flex-1 truncate">{school.name}</span>
                    {school.id === currentSchool.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{currentSchool.name}</TooltipContent>
      </Tooltip>
    )
  }

  return dropdown
}
