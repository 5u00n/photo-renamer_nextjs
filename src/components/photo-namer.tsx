"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Save,
  X,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getFileNameAndExt = (file: File): { name: string; ext: string } => {
  const lastDot = file.name.lastIndexOf(".");
  if (lastDot === -1) {
    return { name: file.name, ext: "" };
  }
  return {
    name: file.name.substring(0, lastDot),
    ext: file.name.substring(lastDot),
  };
};

export function PhotoNamer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [usedNames, setUsedNames] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { name } = getFileNameAndExt(selectedFile);
      setNewName(name);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setIsSaved(false);
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
    setIsSaved(false);
    setIsSaving(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  const handleSave = useCallback(() => {
    if (!file || !newName) return;

    setIsSaving(true);
    setIsSaved(false);

    const sanitizedNewName = newName.replace(/[<>:"/\\|?*]+/g, "_");

    const { ext } = getFileNameAndExt(file);
    let finalName = sanitizedNewName;

    const lowerCaseName = sanitizedNewName.toLowerCase();
    if (usedNames[lowerCaseName]) {
      const count = usedNames[lowerCaseName];
      finalName = `${sanitizedNewName} (${count})`;
      setUsedNames((prev) => ({ ...prev, [lowerCaseName]: count + 1 }));
    } else {
      setUsedNames((prev) => ({ ...prev, [lowerCaseName]: 1 }));
    }

    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = `${finalName}${ext}`;

    setTimeout(() => {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsSaving(false);
      setIsSaved(true);

      setTimeout(() => {
        resetState();
      }, 2000);
    }, 500);
  }, [file, newName, usedNames, resetState]);

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          PhotoNamer
        </CardTitle>
        <CardDescription>Upload a photo, rename it, and save!</CardDescription>
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

              <div className="w-full space-y-2">
                <Label htmlFor="new-name" className="font-medium">New file name</Label>
                <Input
                  id="new-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  disabled={isSaving || isSaved}
                  className="text-base"
                />
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
    </Card>
  );
}
