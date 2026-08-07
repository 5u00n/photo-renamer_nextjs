'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoNamer } from '@/components/photo-namer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Trash2, ShieldAlert, ImageOff, RefreshCw, Images, Sparkles } from 'lucide-react';
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
      <main className="flex-1 flex items-center justify-center p-12 min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 max-w-6xl">
      {/* PhotoNamer Studio Component Section */}
      <section className="flex justify-center relative">
        {/* Subtle Ambient Background Blur Effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-gradient-to-tr from-primary/20 via-indigo-500/10 to-purple-500/20 blur-3xl -z-10 opacity-70 pointer-events-none rounded-full" />
        <PhotoNamer onPhotoSaved={checkAuthAndFetchPhotos} />
      </section>

      {/* User's Photos Gallery Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight font-headline">My Uploaded Photos</h2>
              <Badge variant="secondary" className="font-semibold text-xs rounded-full px-2.5">
                {photos.length}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your student photography collection securely stored in your account database.
            </p>
          </div>
          <Button
            onClick={checkAuthAndFetchPhotos}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="self-start sm:self-auto font-medium shadow-sm hover:bg-muted"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Gallery
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border border-border/60">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="w-full aspect-video rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ImageOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">No Photos Uploaded Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Use the PhotoNamer studio tool above to capture or import your first student photo.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                className="group flex flex-col overflow-hidden border border-border/80 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 rounded-xl bg-card"
              >
                <CardHeader className="p-3.5 pb-2">
                  <CardTitle className="text-sm font-bold truncate flex items-center gap-1.5" title={photo.name}>
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{photo.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-3.5 pt-0">
                  <div className="relative rounded-lg overflow-hidden border bg-black/5 aspect-video group-hover:scale-[1.02] transition-transform duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.data_uri}
                      alt={photo.name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-3.5 pt-1 border-t bg-muted/10">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {new Date(photo.uploaded_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleDownload(photo)}
                      title={`Download ${photo.name}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title={`Delete ${photo.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-lg">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Confirm Photo Deletion
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            Are you sure you want to delete <strong>&quot;{photo.name}&quot;</strong>? This operation cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(photo.id, photo.name)}
                            className="bg-destructive hover:bg-destructive/90 text-xs font-semibold"
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
