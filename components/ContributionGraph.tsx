"use client"

import { useEffect, useState } from 'react'
import { ActivityCalendar } from 'react-activity-calendar'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'

interface Activity {
    date: string
    count: number
    level: number
}

export default function ContributionGraph({ userId }: { userId: string }) {
    const [data, setData] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()

    useEffect(() => {
        const fetchData = async () => {
            // Fetch all posts by user to calculate activity
            const { data: posts } = await supabase
                .from('posts')
                .select('created_at')
                .eq('author_id', userId)

            if (posts) {
                // Process data
                const activities: { [key: string]: number } = {}

                // Initialize last 365 days with 0 (optional, but good for calendar)
                // Actually react-activity-calendar handles missing dates if we provide a range or just let it fill.
                // Better to just provide the days with activity.

                posts.forEach(post => {
                    const date = post.created_at.split('T')[0]
                    activities[date] = (activities[date] || 0) + 1
                })

                // Generate last 365 days to ensure full graph? 
                // Getting start date
                const today = new Date()
                const oneYearAgo = new Date()
                oneYearAgo.setFullYear(today.getFullYear() - 1)

                const filledData: Activity[] = []
                for (let d = oneYearAgo; d <= today; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0]
                    const count = activities[dateStr] || 0

                    // Level 0-4
                    let level = 0
                    if (count > 0) level = 1
                    if (count > 2) level = 2
                    if (count > 4) level = 3
                    if (count > 6) level = 4

                    filledData.push({
                        date: dateStr,
                        count,
                        level
                    })
                }

                setData(filledData)
            }
            setLoading(false)
        }
        fetchData()
    }, [userId])

    if (loading) return <div className="animate-pulse h-32 bg-gray-900/50 rounded-lg"></div>

    return (
        <div className="p-6 bg-gray-950/50 border border-gray-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Contribution Activity</h3>
            <div className="flex justify-center">
                <ActivityCalendar
                    data={data}
                    theme={{
                        light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                        dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    }}
                    colorScheme={theme === 'dark' ? 'dark' : 'light'}
                    showWeekdayLabels
                    blockSize={12}
                    blockMargin={4}
                    fontSize={12}
                    labels={{
                        legend: {
                            less: 'Less',
                            more: 'More',
                        },
                        months: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ],
                        totalCount: '{{count}} posts in the last year',
                        weekdays: [
                            'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
                        ]
                    }}
                />
            </div>
        </div>
    )
}
