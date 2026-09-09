'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Home,
  Sparkles,
  BookCheck,
  CalendarDays,
  Settings,
} from 'lucide-react'

import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'

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

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-svh bg-background">

      {/* スマートフォン用ヘッダー */}
      <Header />

      {/* PC用サイドバー */}
      <Sidebar />

      {/* メインコンテンツ */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>

      {/* スマートフォン用下部ナビゲーション */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">

          {NAV.map((item) => {
            const active = isActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-primary'
                    : 'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground'
                }
              >
                <item.icon className="size-5" />

                <span>
                  {item.label}
                </span>
              </Link>
            )
          })}

        </div>
      </nav>

    </div>
  )
}