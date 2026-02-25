"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  task_id?: number
}

interface NotificationBellProps {
  userId: string
  token: string
}

export function NotificationBell({ userId, token }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [usePolling, setUsePolling] = useState(false)

  // Try WebSocket SSE first, fallback to polling if unavailable
  useEffect(() => {
    if (!userId || !token) return

    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout
    let pollingInterval: NodeJS.Timeout
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 3

    const connectSSE = () => {
      try {
        // Try to connect to WebSocket service SSE endpoint
        const url = new URL(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}/tasks/updates`
        )
        url.searchParams.set("user_id", userId)

        eventSource = new EventSource(url.toString(), {
          withCredentials: false,
        })

        eventSource.onopen = () => {
          console.log("✓ Connected to notification service (SSE)")
          setIsConnected(true)
          setUsePolling(false)
          reconnectAttempts = 0
        }

        eventSource.onerror = (error) => {
          console.warn("✗ SSE connection error:", error)
          setIsConnected(false)
          eventSource?.close()

          reconnectAttempts++

          // After max attempts, switch to polling
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Switching to polling mode (SSE unavailable)")
            setUsePolling(true)
            startPolling()
          } else {
            // Try reconnecting
            reconnectTimeout = setTimeout(() => {
              console.log(`Reconnecting to SSE (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`)
              connectSSE()
            }, 5000)
          }
        }

        // Listen for notification.alert events
        eventSource.addEventListener("notification.alert", (event) => {
          try {
            const data = JSON.parse(event.data)
            handleNotification(data)
          } catch (error) {
            console.error("Error parsing notification:", error)
          }
        })

        // Listen for generic update events
        eventSource.addEventListener("update", (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.event_type === "notification.alert") {
              handleNotification(data)
            }
          } catch (error) {
            console.error("Error parsing update:", error)
          }
        })
      } catch (error) {
        console.error("Error connecting to SSE:", error)
        setUsePolling(true)
        startPolling()
      }
    }

    const startPolling = () => {
      console.log("✓ Using polling mode for notifications")
      setIsConnected(true) // Show as connected in polling mode

      // Poll for notifications every 30 seconds
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}/api/${userId}/notifications`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (response.ok) {
            const data = await response.json()
            // Handle new notifications from polling
            if (data.notifications && Array.isArray(data.notifications)) {
              data.notifications.forEach((notif: any) => {
                handleNotification(notif)
              })
            }
          } else if (response.status === 404) {
            // Notifications endpoint not implemented yet - this is expected
            // Silently ignore 404 errors
            console.debug("Notifications endpoint not available (Phase 5 feature)")
          }
        } catch (error) {
          // Silently ignore network errors for notifications
          console.debug("Polling error (notifications unavailable):", error)
        }
      }, 30000) // Poll every 30 seconds
    }

    const handleNotification = (data: any) => {
      const notification: Notification = {
        id: data.alert_id || data.id || Date.now().toString(),
        title: data.title || "Task Reminder",
        message: data.message || "You have a task due soon",
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        task_id: data.task_id,
      }

      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) {
          return prev
        }
        return [notification, ...prev]
      })
      setUnreadCount((prev) => prev + 1)

      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      })
    }

    // Try SSE first
    connectSSE()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (pollingInterval) clearInterval(pollingInterval)
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [userId, token])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      return prev.filter((n) => n.id !== notificationId)
    })
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500" title={usePolling ? "Connected (Polling)" : "Connected (Real-time)"} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                    className="h-auto p-1"
                  >
                    ×
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {usePolling && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-blue-600 dark:text-blue-400 text-center">
              Polling mode (checks every 30s)
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
