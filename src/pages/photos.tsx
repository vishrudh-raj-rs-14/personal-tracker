import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWeeklyPhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/use-photos'
import { Upload, X, ChevronDown, ChevronUp, Calendar, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { getWeekStart } from '@/lib/utils'

type PhotoWithUrl = {
  id: string
  user_id: string
  week_start: string
  image_url: string
  created_at: string
  signed_url: string
}

export function PhotosPage() {
  const { data: photos, isLoading } = useWeeklyPhotos()
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()
  const { toast } = useToast()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  // Group photos by week_start
  const groupedPhotos = useMemo(() => {
    if (!photos) return new Map<string, PhotoWithUrl[]>()

    const grouped = new Map<string, PhotoWithUrl[]>()
    
    photos.forEach((photo) => {
      const weekKey = photo.week_start
      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, [])
      }
      grouped.get(weekKey)!.push(photo as PhotoWithUrl)
    })

    // Sort weeks by date (newest first)
    return new Map(
      Array.from(grouped.entries()).sort((a, b) => 
        new Date(b[0]).getTime() - new Date(a[0]).getTime()
      )
    )
  }, [photos])

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(weekKey)) {
        newSet.delete(weekKey)
      } else {
        newSet.add(weekKey)
      }
      return newSet
    })
  }

  const handleDelete = async (photo: PhotoWithUrl, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    setDeletingPhotoId(photo.id)
    try {
      await deletePhoto.mutateAsync(photo)
      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed.',
      })
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    try {
      await uploadPhoto.mutateAsync(file)
      toast({
        title: 'Photo uploaded!',
        description: 'Your progress photo has been saved.',
      })
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading photos...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalPhotos = photos?.length || 0
  const currentWeekStart = getWeekStart()
  const hasPhotosThisWeek = photos?.some(
    (photo) => photo.week_start === currentWeekStart
  ) || false

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Weekly Photo Reminder Banner */}
      {!hasPhotosThisWeek && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">📸 Weekly Photo Reminder</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Don't forget to upload your progress photo for this week! Track your transformation over time.
                </p>
                <Button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Progress Photos
          </h1>
          {totalPhotos > 0 && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} across {groupedPhotos.size} week{groupedPhotos.size !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="photo-upload"
            disabled={uploadPhoto.isPending}
          />
          <Button
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={uploadPhoto.isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {totalPhotos === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start tracking your progress by uploading your first photo. Take weekly photos to see your transformation over time!
            </p>
            <Button
              onClick={() => document.getElementById('photo-upload')?.click()}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Photo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grouped Photos */}
      {groupedPhotos.size > 0 && (
        <div className="space-y-4">
          {Array.from(groupedPhotos.entries()).map(([weekKey, weekPhotos]) => {
            const weekDate = parseISO(weekKey)
            const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 })
            const isExpanded = expandedWeeks.has(weekKey)
            const photoCount = weekPhotos.length

            return (
              <Card key={weekKey} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleWeek(weekKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {photoCount} photo{photoCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWeek(weekKey)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {weekPhotos.map((photo) => {
                        const imageUrl = photo.signed_url || photo.image_url
                        const isDeleting = deletingPhotoId === photo.id
                        return (
                          <div
                            key={photo.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-muted"
                          >
                            <img
                              src={imageUrl}
                              alt={`Progress photo for week of ${format(weekStart, 'MMM dd, yyyy')}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => setSelectedPhoto(imageUrl)}
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
                                  Click to view
                                </div>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {format(parseISO(photo.created_at), 'MMM dd')}
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
                              onClick={(e) => handleDelete(photo, e)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}

                {/* Show first photo as preview when collapsed */}
                {!isExpanded && weekPhotos.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {weekPhotos.slice(0, 4).map((photo) => {
                        const imageUrl = photo.signed_url || photo.image_url
                        const isDeleting = deletingPhotoId === photo.id
                        return (
                          <div
                            key={photo.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-muted"
                          >
                            <img
                              src={imageUrl}
                              alt={`Progress photo preview`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => setSelectedPhoto(imageUrl)}
                              loading="lazy"
                            />
                            {weekPhotos.length > 4 && photo === weekPhotos[3] && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                                <span className="text-white font-semibold text-lg">
                                  +{weekPhotos.length - 4} more
                                </span>
                              </div>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
                              onClick={(e) => handleDelete(photo, e)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Full Screen Photo Viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-full w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={selectedPhoto}
              alt="Progress photo"
              className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
