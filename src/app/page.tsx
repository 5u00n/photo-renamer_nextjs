'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoNamer } from '@/components/photo-namer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Trash2, ShieldAlert, ImageOff, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: number;
  name: string;
  data_uri: string;
  uploaded_at: string;
  username?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();

  const checkAuthAndFetchPhotos = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      setIsCheckingAuth(false);

      const photosRes = await fetch('/api/photos');
      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data);
      }
    } catch {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndFetchPhotos();
  }, [checkAuthAndFetchPhotos]);

  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.data_uri;
    const fileExtension = photo.data_uri.split(';')[0].split('/')[1] || 'png';
    link.download = `${photo.name}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (photoId: number, photoName: string) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete photo');
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast({
        title: 'Photo Deleted',
        description: `"${photoName}" has been removed.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Error deleting photo',
      });
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      {/* Upload Component */}
      <section className="flex justify-center">
        <PhotoNamer onPhotoSaved={checkAuthAndFetchPhotos} />
      </section>

      {/* User's Photos Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold font-headline">My Uploaded Photos</h2>
            <p className="text-sm text-muted-foreground">
              Photos uploaded by your account. Only you (and administrators) can view these.
            </p>
          </div>
          <Button onClick={checkAuthAndFetchPhotos} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-full aspect-video rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 bg-background rounded-lg border border-dashed p-8">
            <ImageOff className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">No Uploads Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Use the PhotoNamer tool above to upload or take a student photo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold truncate" title={photo.name}>
                    {photo.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.data_uri}
                    alt={photo.name}
                    className="rounded-md object-cover aspect-video w-full"
                    loading="lazy"
                  />
                </CardContent>
                <CardFooter className="flex justify-between items-center px-4 pb-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(photo.uploaded_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDownload(photo)}
                      title={`Download ${photo.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive" title={`Delete ${photo.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Confirm Deletion
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>&quot;{photo.name}&quot;</strong>? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(photo.id, photo.name)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete Photo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
