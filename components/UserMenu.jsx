'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, User, LogOut, Settings, Store, Shield, ShoppingBag, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const UserMenu = ({ size = 'md', showLabel = false }) => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)

  // Fetch user roles
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${user.id}/roles`)
        const result = await response.json()
        if (result.success) {
          const roles = result.data.roles || []
          setUserRoles(roles)
        }
      } catch (error) {
        console.error('Error fetching user roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setIsOpen(false)
  }

  // Define menu items based on roles
  const getMenuItems = () => {
    const items = []

    // Common items for all authenticated users
    items.push({
      label: 'Profile',
      href: '/profile',
      icon: User,
    })

    // Role-based items
    if (userRoles.includes('Admin')) {
      items.push({
        label: 'Admin Dashboard',
        href: '/admin',
        icon: Shield,
      })
    }

    if (userRoles.includes('Vendor')) {
      items.push({
        label: 'Store Dashboard',
        href: '/store',
        icon: Store,
      })
    }

    // Common items
    items.push({
      label: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
    })

    items.push({
      label: 'Settings',
      href: '/profile',
      icon: Settings,
    })

    return items
  }

  if (!user) {
    return null
  }

  const menuItems = getMenuItems()
  const avatarSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const imageSize = size === 'sm' ? 32 : 40

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all hover:opacity-80 ${showLabel ? 'px-2 py-1 rounded-md hover:bg-slate-50' : 'rounded-full'}`}
        aria-label="User menu"
      >
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={user.fullName || 'User'}
            width={imageSize}
            height={imageSize}
            className={`${avatarSize} rounded-full object-cover`}
          />
        ) : (
          <div className={`${avatarSize} rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium`}>
            {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || 'U'}
          </div>
        )}
        <ChevronDownIcon
          size={16}
          className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user.fullName || user.firstName || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
            {userRoles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Icon size={16} className="text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-200 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu

