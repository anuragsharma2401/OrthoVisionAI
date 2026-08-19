import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Bell,
  Bone,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileScan,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UploadCloud,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

const navigationItems = [
  {
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
      { icon: UploadCloud, label: 'X-ray Analysis', to: '/dashboard', disabled: true },
      { icon: FileScan, label: 'Medical Reports', to: '/dashboard', disabled: true },
      { icon: History, label: 'Analysis History', to: '/dashboard', disabled: true },
      { icon: HeartPulse, label: 'Recovery Guidance', to: '/dashboard', disabled: true },
      { icon: CalendarClock, label: 'Health Timeline', to: '/dashboard', disabled: true },
    ],
  },
  {
    items: [
      { icon: User, label: 'Profile', to: '/profile' },
      { icon: Settings, label: 'Settings', to: '/settings' },
    ],
  },
]

function DashboardLayout({ children, pageTitle = 'Dashboard' }) {
  const { logout, user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  function closeMobileMenu() {
    setIsMobileOpen(false)
  }

  return (
    <main className={`dashboard-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label="Open dashboard menu"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      <div
        className={`dashboard-backdrop ${isMobileOpen ? 'visible' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link className="brand sidebar-brand" to="/">
            <span className="brand-mark">
              <Bone size={18} aria-hidden="true" />
            </span>
            <span>OrthoVision AI</span>
          </Link>

          <button
            className="sidebar-close"
            type="button"
            aria-label="Close dashboard menu"
            onClick={closeMobileMenu}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navigationItems.map((group, groupIndex) => (
            <div className="sidebar-nav-group" key={`nav-group-${groupIndex}`}>
              {group.items.map((item) =>
                item.disabled ? (
                  <button
                    className="sidebar-link"
                    key={item.label}
                    title={isCollapsed ? item.label : undefined}
                    type="button"
                  >
                    <item.icon size={19} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <NavLink
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    key={item.label}
                    title={isCollapsed ? item.label : undefined}
                    to={item.to}
                    onClick={closeMobileMenu}
                  >
                    <item.icon size={19} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="collapse-button"
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            <span>Collapse</span>
          </button>

          <button
            className="logout-button"
            type="button"
            title={isCollapsed ? 'Logout' : undefined}
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h1>{pageTitle}</h1>
          </div>

          <div className="topbar-actions">
            <button className="notification-button" type="button" aria-label="Notifications">
              <Bell size={19} />
              <span></span>
            </button>

            <button className="profile-chip" type="button">
              <span className="avatar">{user?.name?.charAt(0) || 'U'}</span>
              <span>
                {/* <strong>{user?.name || 'Anurag'}</strong>
                <small>{user?.role || 'OrthoVision User'}</small> */}
                <strong>{'Anurag'}</strong>
                <small>{'OrthoVision User'}</small>
              </span>
            </button>
          </div>
        </header>

        {children}
      </section>
    </main>
  )
}

export default DashboardLayout
