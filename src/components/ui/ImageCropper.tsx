"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, RotateCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel, isUploading }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // Aspect ratio 1:1 para foto de perfil
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Manejar rotación
    const centerX = canvas.width / (2 * pixelRatio);
    const centerY = canvas.height / (2 * pixelRatio);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop, rotation]);

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recortar imagen</h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center bg-slate-900 rounded-xl p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              onLoad={onImageLoad}
              style={{
                maxHeight: "400px",
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleRotate}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
            disabled={isUploading}
          >
            <RotateCw className="w-4 h-4" />
            Rotar
          </button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
