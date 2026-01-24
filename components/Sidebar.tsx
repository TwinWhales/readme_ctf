"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";
import { 
  Globe, 
  Terminal, 
  Cpu, 
  Lock, 
  Box, 
  BookOpen, 
  LayoutGrid, 
  Flag,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Globe,
  Terminal,
  Cpu,
  Lock,
  Box,
  Search,
  Flag,
  LayoutGrid,
  BookOpen
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'user' | 'manager' | 'admin' | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Add Category State
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        // 1. Check User Role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                setUserRole(profile.role as any);
            }
        }

        // 2. Fetch Categories
        fetchCategories();
    };
    init();
  }, []);

  const fetchCategories = async () => {
      const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
      
      if (data) {
          setCategories(data as Category[]);
      }
      setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName.trim()) return;

      setAddingLoading(true);
      const { error } = await supabase.from('categories').insert({
          name: newCatName.trim(),
          icon: 'Box' // Default icon for now
      });

      if (error) {
          alert("Error adding room: " + error.message);
      } else {
          setNewCatName("");
          setIsAdding(false);
          fetchCategories();
          router.refresh();
      }
      setAddingLoading(false);
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: string, name: string) => {
      e.preventDefault(); // Prevent link navigation
      e.stopPropagation();

      if (!confirm(`Are you sure you want to delete the "${name}" room? This action cannot be undone.`)) return;

      const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

      if (error) {
          alert("Error deleting room: " + error.message);
      } else {
          fetchCategories();
          router.refresh();
      }
  };

  // Static items
  const staticItems = [
      { name: "CTF Writeups", href: "/", icon: Flag },
      { name: "All Study Notes", href: "/study/all", icon: LayoutGrid },
  ];

  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const isAdmin = userRole === 'admin';

  return (
    <aside 
        className={cn(
            "hidden md:flex flex-col border-r border-border bg-card/30 min-h-[calc(100vh-4rem)] sticky top-0 transition-all duration-300 ease-in-out relative group/sidebar",
            isCollapsed ? "w-16" : "w-64"
        )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-card border border-border rounded-full p-1 text-muted-foreground hover:text-primary hover:border-primary shadow-sm z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="p-4 flex-1 overflow-hidden">
        <div className={cn("flex items-center mb-4 transition-all", isCollapsed ? "justify-center" : "justify-between px-2")}>
             {!isCollapsed && (
                 <h2 className="text-lg font-semibold flex items-center whitespace-nowrap overflow-hidden">
                    <BookOpen className="mr-2 h-5 w-5 shrink-0" />
                    Study Rooms
                </h2>
             )}
            {isCollapsed && <BookOpen className="h-6 w-6 text-primary" />}

            {!isCollapsed && isAdminOrManager && (
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Add Room"
                >
                    <Plus className="h-4 w-4" />
                </button>
            )}
        </div>

        {/* Add Category Form */}
        {!isCollapsed && isAdding && (
            <div className="mb-4 px-2">
                <form onSubmit={handleAddCategory} className="bg-muted/50 p-3 rounded-lg border border-border">
                    <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Room Name" 
                        className="w-full bg-background border border-input rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                        <button 
                            type="button" 
                            onClick={() => setIsAdding(false)}
                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={addingLoading}
                            className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded hover:bg-primary/90 disabled:opacity-50 flex items-center"
                        >
                            {addingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        <nav className="space-y-1">
          {/* Static Links */}
          {staticItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed ? "justify-center px-0 py-3" : ""
                    )}
                    title={isCollapsed ? item.name : undefined}
                >
                    <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
          })}

          <div className="my-2 border-t border-border mx-2 opacity-50"></div>

          {/* Dynamic Categories */}
          {loading ? (
              !isCollapsed && <div className="px-4 py-2 text-xs text-muted-foreground">Loading...</div>
          ) : categories.map((cat) => {
            const href = `/study/${cat.name}`;
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const Icon = ICON_MAP[cat.icon] || Box;
            
            return (
              <Link
                key={cat.id}
                href={href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap group relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed ? "justify-center px-0 py-3" : ""
                )}
                title={isCollapsed ? cat.name : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span className="flex-1 truncate">{cat.name}</span>}
                
                {/* Delete Button (Admin Only) */}
                {!isCollapsed && isAdmin && (
                    <button
                        onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-all"
                        title="Delete Room"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {!isCollapsed && (
        <div className="mt-auto p-4 border-t border-border">
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Study Tip</p>
            <p className="line-clamp-2">Share your knowledge!</p>
            </div>
        </div>
      )}
    </aside>
  );
}
