import { useEffect } from 'react'
import { useWeeklyPhotos } from './use-photos'
import { useToast } from '@/components/ui/use-toast'
import { getWeekStart } from '@/lib/utils'

/**
 * Hook to check if user needs to upload weekly photos and show in-app notifications
 */
export function usePhotoReminder() {
  const { data: photos } = useWeeklyPhotos()
  const { toast } = useToast()

  useEffect(() => {
    // Check once per session if user needs photo reminder
    const reminderShown = sessionStorage.getItem('photo-reminder-shown')
    if (reminderShown) return

    // Wait a bit for photos to load
    const timer = setTimeout(() => {
      checkPhotoReminder()
    }, 2000)

    return () => clearTimeout(timer)
  }, [photos])

  const checkPhotoReminder = () => {
    if (!photos) return

    const currentWeekStart = getWeekStart()
    const hasPhotosThisWeek = photos.some(
      (photo) => photo.week_start === currentWeekStart
    )

    if (!hasPhotosThisWeek) {
      // Show reminder notification
      toast({
        title: '📸 Weekly Photo Reminder',
        description: `Don't forget to upload your progress photo for this week! Track your transformation over time.`,
        duration: 8000,
      })

      // Mark as shown for this session
      sessionStorage.setItem('photo-reminder-shown', 'true')
    }
  }

  return { checkPhotoReminder }
}

