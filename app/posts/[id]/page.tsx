
import { supabase } from '@/lib/supabase'
import PostDetail from '@/components/PostDetail'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: post } = await supabase.from('posts').select('title, category').eq('id', id).single()

    if (!post) {
        return { title: 'Post Not Found' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Ensure protocol
    const finalUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`
    const ogUrl = new URL(`${finalUrl}/api/og`)
    ogUrl.searchParams.set('title', post.title)
    if (post.category) ogUrl.searchParams.set('category', post.category)

    return {
        title: post.title,
        openGraph: {
            title: post.title,
            images: [
                {
                    url: ogUrl.toString(),
                    width: 1200,
                    height: 630,
                },
            ],
        },
    }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <PostDetail id={id} />
}
