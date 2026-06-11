'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function UserMenu({ darkMode = true }: { darkMode?: boolean }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!session?.user) return null

  const name = session.user.name || session.user.email || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
        }`}
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={name}
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-xs font-medium text-emerald-400">{initial}</span>
          </div>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-lg z-50 py-1 ${
            darkMode
              ? 'bg-[#1f1f1f] border-[#2a2a2a]'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className={`px-3 py-2 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
            <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {session.user.name}
            </p>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {session.user.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              darkMode
                ? 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
