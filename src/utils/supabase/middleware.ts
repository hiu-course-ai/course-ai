import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({
                    request,
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
            )
        },
    },
}
)

// セッションの検証と自動更新（サーバー側では getSession() ではなく必ず getUser() を使用）
const {
    data: { user },
} = await supabase.auth.getUser()

const pathname = request.nextUrl.pathname

// 1. 未ログインユーザーは /login へリダイレクト（/login と /auth/* は除外）
if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth')
) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
}

// 2. ログイン済みユーザーが /login にアクセスした場合はトップページへリダイレクト
if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
}

return supabaseResponse
}