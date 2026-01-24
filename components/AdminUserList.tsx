"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Profile } from "@/types"
import { Search, Shield, ShieldAlert, ShieldCheck, User as UserIcon } from "lucide-react"

export default function AdminUserList({ currentUser }: { currentUser: any }) {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        // Note: RLS must allow admins to select all profiles
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (search) {
            query = query.ilike('username', `%${search}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching users:', error)
        } else {
            setUsers(data as Profile[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [search])

    const handleRoleChange = async (userId: string, newRole: 'user' | 'manager' | 'admin') => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

        setUpdating(userId)
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) {
            alert('Failed to update role: ' + error.message)
        } else {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        }
        setUpdating(null)
    }

    const getRoleIcon = (role?: string) => {
        switch (role) {
            case 'admin': return <ShieldAlert className="h-4 w-4 text-red-500" />
            case 'manager': return <ShieldCheck className="h-4 w-4 text-green-500" />
            default: return <UserIcon className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Admin Dashboard: User Management
                </h2>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full bg-muted/50 border border-input rounded-md pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">User</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                             <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No users found</td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold overflow-hidden">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.username || 'User'} className="h-full w-full object-cover" />
                                            ) : (
                                                (user.username?.[0] || '?').toUpperCase()
                                            )}
                                        </div>
                                        <div className="font-medium text-foreground">
                                            {user.username || 'Anonymous'}
                                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">{user.id}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(user.role)}
                                            <span className="capitalize">{user.role || 'user'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {user.id !== currentUser.id ? (
                                            <select 
                                                className="bg-gray-900 border border-gray-700 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
                                                value={user.role || 'user'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                disabled={updating === user.id}
                                            >
                                                <option value="user">User</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Current User</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
