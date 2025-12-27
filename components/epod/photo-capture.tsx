"use client";

import { useState, useRef } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCaptureProps {
  onPhotoCapture: (file: File, preview: string) => void;
  maxPhotos?: number;
  acceptedTypes?: string;
}

export function PhotoCapture({
  onPhotoCapture,
  maxPhotos = 10,
  acceptedTypes = "image/*",
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (photos.length >= maxPhotos) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setPhotos((prev) => [...prev, { file, preview }]);
        onPhotoCapture(file, preview);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (e.target) e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={photos.length >= maxPhotos}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          disabled={photos.length >= maxPhotos}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-sm text-gray-500">
          {photos.length} of {maxPhotos} photos added
        </p>
      )}
    </div>
  );
}
