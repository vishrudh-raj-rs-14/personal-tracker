import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getWeekStart } from '@/lib/utils'

export interface WeeklyPhoto {
  id: string
  user_id: string
  week_start: string
  image_url: string // This is the file path, not a URL
  created_at: string
}

export function useWeeklyPhotos() {
  return useQuery({
    queryKey: ['weekly-photos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('weekly_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })

      if (error) throw error

      // Generate signed URLs for each photo
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          // Check if image_url is already a full URL (old format) or a file path
          const isFullUrl = photo.image_url.startsWith('http://') || photo.image_url.startsWith('https://')
          
          let filePath = photo.image_url
          
          if (isFullUrl) {
            // Extract file path from old public URL format
            // URL format: https://xxx.supabase.co/storage/v1/object/public/progress-photos/user_id/filename.png
            // or: https://xxx.supabase.co/storage/v1/object/sign/progress-photos/user_id/filename.png?token=...
            try {
              const url = new URL(photo.image_url)
              const pathParts = url.pathname.split('/')
              const bucketIndex = pathParts.indexOf('progress-photos')
              if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                // Extract path after bucket name
                filePath = pathParts.slice(bucketIndex + 1).join('/')
              }
            } catch (e) {
              // If URL parsing fails, try to use the image_url as-is
              console.warn('Failed to parse image URL:', photo.image_url)
            }
          }

          // Generate signed URL (valid for 1 hour)
          const { data: signedUrlData } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(filePath, 3600) // 1 hour expiry

          return {
            ...photo,
            signed_url: signedUrlData?.signedUrl || photo.image_url,
          }
        })
      )

      return photosWithUrls as (WeeklyPhoto & { signed_url: string })[]
    },
  })
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const weekStart = getWeekStart()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${weekStart}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Save file path (not URL) to database
      // We'll generate signed URLs when displaying
      const { data, error } = await supabase
        .from('weekly_photos')
        .insert({
          user_id: user.id,
          week_start: weekStart,
          image_url: fileName, // Store the file path, not a URL
        })
        .select()
        .single()

      if (error) throw error
      return data as WeeklyPhoto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-photos'] })
    },
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photo: WeeklyPhoto) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete from storage
      const filePath = photo.image_url
      const { error: storageError } = await supabase.storage
        .from('progress-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('weekly_photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', user.id)

      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-photos'] })
    },
  })
}

