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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Save,
  X,
  CheckCircle2,
  RotateCw,
  Info,
  Camera,
  RefreshCcw,
  Video,
  FolderPlus,
  FlipHorizontal,
  Sliders,
  Sparkles,
  User,
  Zap,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const dataUriToBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

type FacingMode = "user" | "environment";
type ResolutionMode = "auto" | "4k" | "1080p" | "720p";

interface PhotoNamerProps {
  onPhotoSaved?: () => void;
}

export function PhotoNamer({ onPhotoSaved }: PhotoNamerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [mode, setMode] = useState<"upload" | "camera" | "tether">("upload");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  // External Hardware & Camera Controls State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");
  const [resolution, setResolution] = useState<ResolutionMode>("1080p");
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  
  // Studio Tethered Watch Folder State
  const [tetherDirHandle, setTetherDirHandle] = useState<any>(null);
  const [tetherFolderName, setTetherFolderName] = useState<string | null>(null);
  const [isScanningTether, setIsScanningTether] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const refreshVideoDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      setHasMultipleCameras(videoInputs.length > 1);
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => {
      refreshVideoDevices();
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshVideoDevices]);

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera not supported on this browser.");
      setHasCameraPermission(false);
      return;
    }
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const resConstraints: MediaTrackConstraints = {};
      if (resolution === "4k") {
        resConstraints.width = { ideal: 3840 };
        resConstraints.height = { ideal: 2160 };
      } else if (resolution === "1080p") {
        resConstraints.width = { ideal: 1920 };
        resConstraints.height = { ideal: 1080 };
      } else if (resolution === "720p") {
        resConstraints.width = { ideal: 1280 };
        resConstraints.height = { ideal: 720 };
      }

      const videoConstraints: MediaTrackConstraints = {
        ...resConstraints,
        ...(selectedDeviceId && selectedDeviceId !== "default"
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: facingMode }),
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      await refreshVideoDevices();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description:
          "Could not initialize selected camera. Check USB connection or browser permissions.",
      });
    }
  }, [facingMode, selectedDeviceId, resolution, refreshVideoDevices, toast]);

  useEffect(() => {
    if (mode === "camera" && !previewUrl) {
      getCameraPermission();
    } else if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [mode, previewUrl, getCameraPermission]);

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
      setError("Please select a valid image file.");
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const context = canvas.getContext("2d");
      if (context) {
        if (isMirrored) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg", 0.95);
        const blob = dataUriToBlob(dataUri);
        const capturedFile = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        handleFile(capturedFile);
      }
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

  const handleConnectTetherFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      toast({
        variant: "destructive",
        title: "Tethering Feature Restricted",
        description:
          "Direct folder selection requires Chrome, Edge, or Brave browser. You can still drag & drop tethered files below.",
      });
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker();
      setTetherDirHandle(handle);
      setTetherFolderName(handle.name);
      toast({
        title: "Tether Folder Connected",
        description: `Connected to "${handle.name}". Click "Import Latest Photo" to fetch the newest studio capture.`,
      });
      await scanAndImportLatestTetherFile(handle);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Folder Error",
          description: "Failed to open tether directory.",
        });
      }
    }
  };

  const scanAndImportLatestTetherFile = async (handleOverride?: any) => {
    const handle = handleOverride || tetherDirHandle;
    if (!handle) return;
    setIsScanningTether(true);
    try {
      let latestFile: File | null = null;
      let latestMtime = 0;

      for await (const entry of handle.values()) {
        if (entry.kind === "file") {
          const fileObj = await entry.getFile();
          if (
            fileObj.type.startsWith("image/") &&
            fileObj.lastModified > latestMtime
          ) {
            latestMtime = fileObj.lastModified;
            latestFile = fileObj;
          }
        }
      }

      if (latestFile) {
        handleFile(latestFile);
        toast({
          title: "Studio Photo Loaded",
          description: `Imported newest tether file: ${latestFile.name}`,
        });
      } else {
        toast({
          title: "No Images Found",
          description: "No photo files found in the connected tether folder yet.",
        });
      }
    } catch (err) {
      console.error("Error reading tether folder:", err);
      toast({
        variant: "destructive",
        title: "Tether Scan Failed",
        description: "Unable to read files from folder.",
      });
    } finally {
      setIsScanningTether(false);
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
    if (tempName.trim()) {
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

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoDataUri,
          newName: newName.trim(),
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.photo?.name && result.photo.name !== newName) {
          setNewName(result.photo.name);
        }
        setIsSaved(true);
        if (onPhotoSaved) {
          onPhotoSaved();
        }
        setTimeout(() => {
          resetState();
        }, 2000);
      } else {
        const details = result.details
          ? Object.values(result.details).flat().join(" ")
          : "";
        setError(result.error || details || "An unknown error occurred.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save photo.");
    } finally {
      setIsSaving(false);
    }
  }, [file, newName, resetState, onPhotoSaved]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setSelectedDeviceId("default");
  };

  return (
    <>
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl border border-border/80 bg-card/95 backdrop-blur-lg overflow-hidden transition-all duration-300">
        <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5">
              <Zap className="w-3 h-3 mr-1 text-primary" /> Camera Studio Pro
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight font-headline">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-purple-600">
              PhotoNamer
            </span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Connect Mirrorless/DSLR cameras, monitor studio tether folders, or upload files directly.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {!previewUrl ? (
              <Tabs
                value={mode}
                onValueChange={(value) =>
                  setMode(value as "upload" | "camera" | "tether")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-muted/80 p-1.5 rounded-xl border">
                  <TabsTrigger
                    value="upload"
                    className="text-xs sm:text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <Upload className="mr-1.5 h-4 w-4" /> Upload File
                  </TabsTrigger>
                  <TabsTrigger
                    value="camera"
                    className="text-xs sm:text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <Camera className="mr-1.5 h-4 w-4" /> Live Camera
                  </TabsTrigger>
                  <TabsTrigger
                    value="tether"
                    className="text-xs sm:text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <FolderPlus className="mr-1.5 h-4 w-4" /> Studio Tether
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: UPLOAD PHOTO */}
                <TabsContent value="upload" className="pt-4">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Label
                      htmlFor="photo-upload"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "group relative flex flex-col items-center justify-center w-full h-60 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 bg-background/50 hover:bg-primary/5",
                        dragOver
                          ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[0.99]"
                          : "border-border hover:border-primary/60"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-14 h-14 mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-7 h-7 text-primary" />
                        </div>
                        <p className="mb-1 text-sm font-medium text-foreground">
                          <span className="font-semibold text-primary underline underline-offset-4">
                            Click to browse
                          </span>{" "}
                          or drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports high-resolution JPEG, PNG, WebP, GIF & HEIC
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
                </TabsContent>

                {/* TAB 2: LIVE CAMERA FEED (MIRRORLESS / UVC CAPTURE CARDS) */}
                <TabsContent value="camera" className="pt-4 space-y-4">
                  {/* Camera & Hardware Controls Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-primary" /> Camera Device
                      </Label>
                      <Select
                        value={selectedDeviceId}
                        onValueChange={(val) => setSelectedDeviceId(val)}
                      >
                        <SelectTrigger className="text-xs h-9 bg-background font-medium">
                          <SelectValue placeholder="Auto / Default Camera" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="default">Auto / Default Camera</SelectItem>
                          {videoDevices.map((device, index) => (
                            <SelectItem
                              key={device.deviceId || index}
                              value={device.deviceId || `device_${index}`}
                            >
                              {device.label || `Camera ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-primary" /> Resolution Stream
                      </Label>
                      <Select
                        value={resolution}
                        onValueChange={(val) =>
                          setResolution(val as ResolutionMode)
                        }
                      >
                        <SelectTrigger className="text-xs h-9 bg-background font-medium">
                          <SelectValue placeholder="Resolution" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4k">4K Ultra HD (3840x2160)</SelectItem>
                          <SelectItem value="1080p">Full HD 1080p (1920x1080)</SelectItem>
                          <SelectItem value="720p">HD 720p (1280x720)</SelectItem>
                          <SelectItem value="auto">Auto / Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Live View Preview Box */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-inner bg-black flex items-center justify-center group">
                    <video
                      ref={videoRef}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-200",
                        {
                          hidden: !hasCameraPermission,
                          "-scale-x-100": isMirrored,
                        }
                      )}
                      autoPlay
                      muted
                      playsInline
                    />

                    {/* Live Indicator Overlay */}
                    {hasCameraPermission && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-white border border-white/10 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium">Live Feed</span>
                        <span className="text-white/60 font-mono text-[10px]">
                          {resolution === "4k" ? "4K" : resolution === "720p" ? "720p" : "1080p"}
                        </span>
                      </div>
                    )}

                    {hasCameraPermission === null && (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-white/80 space-y-2">
                        <RotateCw className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-xs font-medium">Initializing camera stream...</p>
                      </div>
                    )}
                    {hasCameraPermission === false && (
                      <p className="text-destructive-foreground bg-destructive/90 backdrop-blur-sm text-center p-4 text-xs font-medium rounded-lg m-4">
                        Camera access denied or device unavailable. Check USB connection and browser permissions.
                      </p>
                    )}
                  </div>

                  {/* Control Bar Actions */}
                  <div className="flex gap-2 w-full pt-1">
                    <Button
                      onClick={handleCapture}
                      disabled={!hasCameraPermission}
                      className="flex-grow bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-white shadow-lg hover:shadow-primary/20 transition-all text-sm font-semibold h-10"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Photo
                    </Button>
                    <Button
                      onClick={() => setIsMirrored(!isMirrored)}
                      variant={isMirrored ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      title="Mirror Video Stream"
                    >
                      <FlipHorizontal className="h-4 w-4" />
                    </Button>
                    {hasMultipleCameras && (
                      <Button
                        onClick={toggleCamera}
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        title="Cycle Camera Device"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 3: TETHERED STUDIO WATCH FOLDER */}
                <TabsContent value="tether" className="pt-4 space-y-4">
                  <div className="p-5 border rounded-xl bg-gradient-to-b from-muted/50 to-muted/20 text-center space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <HardDrive className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        Mirrorless & DSLR Tethering
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        Compatible with Sony Imaging Edge, Canon EOS Utility, Nikon NX, or Lightroom. Connect your studio tether folder below for full 24MP+ photo auto-import.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                      {["Sony α", "Canon EOS", "Nikon Z", "Fujifilm", "Lightroom"].map((brand) => (
                        <Badge key={brand} variant="secondary" className="text-[10px] font-semibold">
                          {brand}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <Button
                        onClick={handleConnectTetherFolder}
                        variant="outline"
                        className="w-full bg-background font-medium border-border hover:bg-muted"
                      >
                        <FolderPlus className="mr-2 h-4 w-4 text-primary" />
                        {tetherFolderName
                          ? `Folder: ${tetherFolderName}`
                          : "Connect Tether Folder"}
                      </Button>

                      {tetherDirHandle && (
                        <Button
                          onClick={() => scanAndImportLatestTetherFile()}
                          disabled={isScanningTether}
                          className="w-full bg-primary text-primary-foreground font-semibold shadow-md"
                        >
                          {isScanningTether ? (
                            <>
                              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                              Scanning Folder...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Import Latest Tethered Capture
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Photo preview"
                    className="object-contain w-full h-full"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="w-full text-center bg-muted/30 p-3 rounded-lg border">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Target Student Photo Name:</p>
                  <p className="text-xl font-bold text-primary mt-0.5">
                    {newName || "..."}
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!newName || isSaving || isSaved}
                  className={cn(
                    "w-full transition-all duration-300 text-base font-semibold py-6 shadow-lg",
                    isSaved &&
                      "bg-accent hover:bg-accent/90 text-accent-foreground"
                  )}
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="mr-2 h-5 w-5 animate-spin" />
                      Saving Photo...
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Saved to Account!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Save Photo to Database
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>

        {(isSaved || error) && (
          <CardFooter className="px-6 pb-6 pt-0">
            {isSaved && (
              <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 w-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="font-bold">Upload Successful</AlertTitle>
                <AlertDescription className="text-xs">
                  The photo was assigned to student &quot;{newName}&quot; and saved to your account.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="w-full">
                <X className="h-4 w-4" />
                <AlertTitle className="font-bold">Upload Failed</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Student Name Modal */}
      <Dialog
        open={isNameModalOpen}
        onOpenChange={(open) => !open && resetState()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="w-5 h-5 text-primary" /> Enter Student&apos;s Name
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide the student&apos;s full name. This will be used as the photo file identifier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-name" className="text-xs font-semibold">
                  Student Full Name
                </Label>
                <Input
                  id="student-name"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full"
                  placeholder="e.g. John Doe"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!tempName.trim()} className="w-full sm:w-auto font-semibold">
                Set Name & Proceed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
