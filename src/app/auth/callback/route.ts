import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/'
    
    // オープンリダイレクト対策: 外部URLが指定された場合はトップへ戻す
    if (!next.startsWith('/')) {
        next = '/'
    }
    
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                // Vercel の Preview / 本番環境などリバースプロキシ経由のアクセスに対応
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }
    
    // 認証コードがない、またはセッション交換に失敗した場合はエラーパラメータ付きでログイン画面へ戻す
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}