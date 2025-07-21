'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getPhotos, Photo } from '@/ai/flows/get-photos-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, RefreshCw, ServerCrash, Lock } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPhotos = await getPhotos();
      setPhotos(fetchedPhotos);
    } catch (err) {
      setError('Failed to fetch photos. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated]);

  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.dataUri;
    const fileExtension = photo.dataUri.split(';')[0].split('/')[1];
    link.download = `${photo.name}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'Ssuren78626@@') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Lock className="w-6 h-6"/> Admin Access
                    </CardTitle>
                    <CardContent className="pt-4 px-0 pb-0">
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <Input 
                                type="password" 
                                placeholder="Enter password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {authError && (
                                <Alert variant="destructive" className="p-2 text-sm">
                                  <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full">
                                Unlock
                            </Button>
                        </form>
                    </CardContent>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Admin - All Photos</h1>
                </div>
                <Button onClick={fetchPhotos} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-full aspect-video" />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
                <ServerCrash className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-semibold mb-2">An Error Occurred</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={fetchPhotos}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">No Photos Found</h2>
            <p className="text-muted-foreground mt-2">
              Upload some photos on the main page to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg truncate" title={photo.name}>{photo.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.dataUri} alt={photo.name} className="rounded-md object-cover aspect-video w-full" />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  <Button size="icon" variant="outline" onClick={() => handleDownload(photo)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
