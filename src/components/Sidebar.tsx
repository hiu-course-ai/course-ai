'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Home,
  Sparkles,
  BookCheck,
  CalendarDays,
  Settings,
  GraduationCap,
} from 'lucide-react'

const NAV = [
  {
    href: '/',
    label: 'ホーム',
    icon: Home,
  },
  {
    href: '/ai-suggest',
    label: 'AI履修提案',
    icon: Sparkles,
  },
  {
    href: '/courses',
    label: '履修済み科目',
    icon: BookCheck,
  },
  {
    href: '/timetable',
    label: '時間割',
    icon: CalendarDays,
  },
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname.startsWith(href)
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">

      {/* ロゴ */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 px-2"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>

        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          Kurikuru
        </span>
      </Link>

      {/* ナビゲーション */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }
            >
              <item.icon className="size-[18px]" />

              <span>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="mt-4 rounded-xl border border-border bg-card p-3">
        <p className="text-sm font-medium text-foreground">
          山田 太郎
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          情報学部 2年
        </p>
      </div>

    </aside>
  )
}