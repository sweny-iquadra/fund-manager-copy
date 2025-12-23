import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

interface LocalFileUploaderProps {
  onUploadComplete?: (fileUrl: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  children?: React.ReactNode;
}

export function LocalFileUploader({
  onUploadComplete,
  accept = "image/*",
  maxSizeMB = 5,
  className,
  children,
}: LocalFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File must be smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload using fetch directly (apiRequest doesn't handle FormData well)
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      toast({
        title: "Upload successful",
        description: "File uploaded successfully",
      });

      onUploadComplete?.(result.url);
    } catch (error) {
      console.error("Upload error:", error);

      // More detailed error messages
      let errorMessage = "Failed to upload file. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes("413") ||
          error.message.includes("too large")
        ) {
          errorMessage = `File too large. Maximum size allowed is ${maxSizeMB}MB.`;
        } else if (error.message.includes("415")) {
          errorMessage =
            "File type not supported. Please use a different file format.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Check your connection and try again.";
        }
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              {children || (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Choose File"}
                </>
              )}
            </span>
          </Button>
        </label>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-48 max-h-48 rounded-lg border"
          />
        </div>
      )}
    </div>
  );
}
