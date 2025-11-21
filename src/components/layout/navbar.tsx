import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, BarChart3, Image, Target, Settings, Moon, Sun, FileText, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'

export function Navbar() {
  const location = useLocation()
  const { signOut } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setDarkMode(!darkMode)
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
  }, [])

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/photos', icon: Image, label: 'Photos' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/report', icon: FileText, label: 'Report' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9 sm:h-10 sm:w-10">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex text-xs sm:text-sm">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 h-11"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 sm:hidden mt-2"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

