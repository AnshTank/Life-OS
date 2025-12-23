"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LayoutDashboard, Target, CheckSquare, TrendingUp, Users, DollarSign, Circle } from "lucide-react"

export function UniverseNavigator() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
    { href: "/goals", label: "Goals", icon: Target, color: "from-purple-500 to-pink-500" },
    { href: "/tasks", label: "Tasks", icon: CheckSquare, color: "from-green-500 to-emerald-500" },
    { href: "/progress", label: "Progress", icon: TrendingUp, color: "from-orange-500 to-red-500" },
    { href: "/money", label: "Money", icon: DollarSign, color: "from-yellow-500 to-amber-500" },
    { href: "/partner", label: "Partner", icon: Users, color: "from-rose-500 to-pink-500" },
  ]

  if (!mounted) {
    return null
  }

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
      style={{ transform: 'translateY(0)', opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <Link href="/dashboard">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
                whileHover={{ 
                  y: -2,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                }}
                transition={{ duration: 0.3 }}
              >
                <Circle className="w-4 h-4 text-white fill-current" />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Nexus</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Life OS</p>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className="relative px-4 py-2.5 rounded-lg cursor-pointer"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="desktopActiveBackground"
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-lg shadow-lg`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover Background */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-white/60 dark:bg-slate-700/60 rounded-lg"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center gap-2">
                      <motion.div
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className={`w-4 h-4 ${
                          isActive 
                            ? "text-white" 
                            : "text-slate-600 dark:text-slate-400"
                        }`} />
                      </motion.div>
                      <span className={`text-sm font-medium ${
                        isActive 
                          ? "text-white" 
                          : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className="relative p-2.5 rounded-lg cursor-pointer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveBackground"
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-lg shadow-lg`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover Background */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-white/60 dark:bg-slate-700/60 rounded-lg"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    <motion.div
                      className="relative"
                      whileHover={{ rotate: 15, scale: 1.2 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className={`w-5 h-5 ${
                        isActive 
                          ? "text-white" 
                          : "text-slate-600 dark:text-slate-400"
                      }`} />
                    </motion.div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            {mounted && (
              <motion.div 
                className="text-right hidden sm:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </motion.div>
            )}
            
            <motion.div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 0 4px rgba(16, 185, 129, 0.1)",
                  "0 0 0 0 rgba(16, 185, 129, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Online</span>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  )
}