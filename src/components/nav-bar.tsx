'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function NavBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Script Translator</span>
            </Link>
            {user && (
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  href="/scripts"
                  className={`px-3 py-2 rounded-md ${
                    pathname.startsWith('/scripts') ? 'bg-gray-100' : ''
                  }`}
                >
                  Scripts
                </Link>
                <Link 
                  href="/vocabulary"
                  className={`px-3 py-2 rounded-md ${
                    pathname.startsWith('/vocabulary') ? 'bg-gray-100' : ''
                  }`}
                >
                  Vocabulary
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {loading ? (
              <div>Loading...</div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 