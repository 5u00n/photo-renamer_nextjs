'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhotoNamer } from '@/components/photo-namer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  ServerCrash,
  Shield,
  Trash2,
  ShieldAlert,
  ImageOff,
  Search,
  User as UserIcon,
  Upload,
} from 'lucide-react';
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
  user_id: number;
  name: string;
  data_uri: string;
  uploaded_at: string;
  username?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  const fetchAllPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }

      const meData = await meRes.json();
      if (meData.user?.role !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Administrator privileges are required to view this page.',
        });
        router.push('/');
        return;
      }

      const res = await fetch('/api/photos?scope=all');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch photos');
      }
      const data: Photo[] = await res.json();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchAllPhotos();
  }, [fetchAllPhotos]);

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
        description: `"${photoName}" was deleted by Admin.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Error deleting photo',
      });
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      photo.name.toLowerCase().includes(query) ||
      (photo.username && photo.username.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 bg-muted/40 pb-12">
      <header className="bg-background border-b sticky top-16 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:h-16 items-start sm:items-center justify-between gap-4 py-3 sm:py-0">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <h1 className="text-xl font-bold font-headline">Admin Dashboard — All User Uploads</h1>
                {photos.length > 0 && (
                  <span className="text-xs font-semibold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                    {photos.length} total
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowUploader((prev) => !prev)}
                variant={showUploader ? 'secondary' : 'default'}
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                {showUploader ? 'Hide Uploader' : 'Upload Photo'}
              </Button>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by photo or owner..."
                  className="pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={fetchAllPhotos} disabled={isLoading} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Admin Upload Section */}
        {showUploader && (
          <section className="flex justify-center border-b pb-8">
            <PhotoNamer onPhotoSaved={fetchAllPhotos} />
          </section>
        )}

        {/* Photos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <ServerCrash className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Failed to Load Photos</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={fetchAllPhotos}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-background rounded-xl border border-dashed">
            <ImageOff className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">
              {searchQuery ? 'No Photos Match Your Search' : 'No Photos in Database'}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {searchQuery
                ? 'Try adjusting your search filter.'
                : 'Click "Upload Photo" above or upload from the home page to add student photos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                  <CardTitle className="text-base font-semibold truncate" title={photo.name}>
                    {photo.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-medium shrink-0">
                    <UserIcon className="h-3 w-3" />
                    <span>{photo.username || 'unknown'}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.data_uri}
                    alt={`Photo for ${photo.name}`}
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
                            Admin Delete Photo
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>&quot;{photo.name}&quot;</strong> (uploaded by{' '}
                            <strong>{photo.username}</strong>)?
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
      </main>
    </div>
  );
}
