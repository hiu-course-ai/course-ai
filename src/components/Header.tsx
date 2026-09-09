'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>

          <span className="text-lg font-bold tracking-tight">
            Kurikuru
          </span>
        </Link>
      </div>
    </header>
  )
}