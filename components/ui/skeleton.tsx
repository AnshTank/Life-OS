"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button"
}

export function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    text: "h-3 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-lg"
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-slate-200/60 via-slate-300/60 to-slate-200/60 dark:from-slate-800/60 dark:via-slate-700/60 dark:to-slate-800/60 rounded-md animate-shimmer",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <motion.div 
      className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="avatar" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton variant="text" />
          </div>
        </div>
        <Skeleton variant="card" className="h-20" />
        <div className="flex space-x-2">
          <Skeleton variant="button" />
          <Skeleton variant="button" />
        </div>
      </div>
    </motion.div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Skeleton */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </motion.div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <CardSkeleton />
            </motion.div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <CardSkeleton />
          </motion.div>
          
          <div className="grid gap-6 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
              >
                <CardSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}