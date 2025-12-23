"use client"

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient as createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    const supabase = createClient()
    const processingRef = useRef(false)

    useEffect(() => {
        if (code) {
            if (processingRef.current) return
            processingRef.current = true

            const handleCallback = async () => {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    console.error('Auth error:', error)
                }
                router.push(next)
                router.refresh()
            }
            handleCallback()
        } else {
            router.push(next)
        }
    }, [code, next, router, supabase])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground"></div>
                <p>Authenticating...</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground"></div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
