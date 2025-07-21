"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Save,
  X,
  CheckCircle2,
  RotateCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { savePhoto, SavePhotoInput } from "@/ai/flows/save-photo-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function PhotoNamer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setTempName("");
      setIsNameModalOpen(true);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setIsSaved(false);
      setError(null);
    } else {
      setError("Please upload a valid image file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const resetState = useCallback(() => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setNewName("");
    setTempName("");
    setIsSaved(false);
    setIsSaving(false);
    setError(null);
    setIsNameModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if(tempName.trim()) {
      setNewName(tempName.trim());
      setIsNameModalOpen(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!file || !newName) return;

    setIsSaving(true);
    setIsSaved(false);
    setError(null);

    try {
      const photoDataUri = await fileToDataUri(file);
      const input: SavePhotoInput = {
        photoDataUri,
        newName: newName.replace(/[<>:"/\\|?*]+/g, "_"),
      };
      
      const result = await savePhoto(input);

      if (result.success) {
        setIsSaved(true);
        setTimeout(() => {
          resetState();
        }, 2000);
      } else {
        setError(result.message || "An unknown error occurred.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save photo.");
    } finally {
      setIsSaving(false);
    }
  }, [file, newName, resetState]);

  return (
    <>
      <Card className="w-full max-w-md shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">
            PhotoNamer
          </CardTitle>
          <CardDescription>Upload a student's photo and save it to the server.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!previewUrl ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Label
                  htmlFor="photo-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    dragOver
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Any image format (JPG, PNG, GIF, etc.)
                    </p>
                  </div>
                  <Input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </Label>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Photo preview"
                    className="object-contain w-full h-full"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="w-full text-center">
                  <p className="font-medium">File name:</p>
                  <p className="text-lg font-semibold text-primary">{newName || "..."}</p>
                </div>
                
                <Button
                  onClick={handleSave}
                  disabled={!newName || isSaving || isSaved}
                  className={cn("w-full transition-all duration-300 text-lg py-6", 
                    isSaved && "bg-accent hover:bg-accent/90 text-accent-foreground"
                  )}
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Save Photo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        {(isSaved || error) && (
          <CardFooter>
            {isSaved && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>
                    The student photo has been saved to the server. An administrator can now access it.
                  </AlertDescription>
                </Alert>
            )}
             {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        )}
      </Card>

      <Dialog open={isNameModalOpen} onOpenChange={(open) => !open && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Student's Name</DialogTitle>
            <DialogDescription>
              Please enter the student's full name. This will be used as the file name for the photo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="student-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="student-name"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., John Doe"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!tempName.trim()}>Set Name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
