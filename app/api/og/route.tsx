import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // ?title=<title>&category=<category>
        const hasTitle = searchParams.has('title')
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : 'CTF Writeups'

        const category = searchParams.get('category') || 'Security'

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#030712', // gray-950
                        padding: '40px 80px',
                        color: 'white',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Background decoration */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '400px',
                        height: '400px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, transparent 70%)',
                        opacity: 0.2,
                        filter: 'blur(100px)',
                        borderRadius: '50%'
                    }} />

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <div style={{
                            backgroundColor: '#1f2937', // gray-800
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontSize: 20,
                            color: '#60a5fa', // blue-400
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {category}
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: 60,
                            fontWeight: 900,
                            lineHeight: 1.1,
                            marginBottom: '20px',
                            backgroundImage: 'linear-gradient(90deg, #fff, #9ca3af)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {title}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '40px',
                        color: '#9ca3af', // gray-400
                        fontSize: 24,
                    }}>
                        <span style={{ marginRight: '16px' }}>CTF Writeups</span>
                        <span>•</span>
                        <span style={{ marginLeft: '16px' }}>Writeup Platform</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        )
    } catch (e: any) {
        console.log(`${e.message}`)
        return new Response(`Failed to generate the image`, {
            status: 500,
        })
    }
}
