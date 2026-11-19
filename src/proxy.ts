import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
        * 以下の静的アセットを除くすべてのリクエストに Proxy を適用:
        * - _next/static (静的ファイル)
        * - _next/image (画像最適化ファイル)
        * - favicon.ico (ファビコン)
        * - 画像拡張子 (.svg, .png, .jpg, .jpeg, .gif, .webp)
        */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}