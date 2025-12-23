import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocalFileUploader } from "@/components/LocalFileUploader";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Download,
  Trash2,
  User,
  Trophy,
  Star,
} from "lucide-react";

export default function UploadDemo() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [contestBanner, setContestBanner] = useState<string>("");
  const { toast } = useToast();

  const handleProfileUpload = (fileUrl: string) => {
    setProfileImage(fileUrl);
    setUploadedFiles((prev) => [...prev, fileUrl]);
    toast({
      title: "Profile image uploaded",
      description: "Your profile picture has been uploaded successfully",
    });
  };

  const handleBannerUpload = (fileUrl: string) => {
    setContestBanner(fileUrl);
    setUploadedFiles((prev) => [...prev, fileUrl]);
    toast({
      title: "Contest banner uploaded",
      description: "Your contest banner has been uploaded successfully",
    });
  };

  const handleGeneralUpload = (fileUrl: string) => {
    setUploadedFiles((prev) => [...prev, fileUrl]);
    toast({
      title: "File uploaded",
      description: "Your file has been uploaded successfully",
    });
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setProfileImage("");
    setContestBanner("");
    toast({
      title: "Files cleared",
      description: "All uploaded files have been cleared from the demo",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Upload Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test the local file upload system for your contest platform
          </p>
        </div>
        {uploadedFiles.length > 0 && (
          <Button onClick={clearAllFiles} variant="outline" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Profile Image Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <LocalFileUploader
                  accept="image/*"
                  maxSizeMB={5}
                  onUploadComplete={handleProfileUpload}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Profile Picture
                </LocalFileUploader>
              </div>
            </div>
            {profileImage && (
              <div className="text-sm text-green-600">
                ✓ Profile image uploaded successfully
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contest Banner Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Contest Banner Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {contestBanner && (
                <div className="w-full">
                  <img
                    src={contestBanner}
                    alt="Contest Banner"
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <LocalFileUploader
                accept="image/*"
                maxSizeMB={15}
                onUploadComplete={handleBannerUpload}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Contest Banner (Max 15MB)
              </LocalFileUploader>
            </div>
            {contestBanner && (
              <div className="text-sm text-green-600">
                ✓ Contest banner uploaded successfully
              </div>
            )}
          </CardContent>
        </Card>

        {/* General File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              General File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocalFileUploader
              accept="*/*"
              maxSizeMB={25}
              onUploadComplete={handleGeneralUpload}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Any File (Max 25MB)
            </LocalFileUploader>
            <p className="text-sm text-gray-500">
              Supports all file types: images, documents, videos, etc.
            </p>
          </CardContent>
        </Card>

        {/* Upload Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              Storage Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p>
                <strong>Local Development:</strong> Files stored in uploads/
                folder
              </p>
              <p>
                <strong>Supported Formats:</strong> Images, documents, videos
              </p>
              <p>
                <strong>Max File Size:</strong> 25MB per file
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium">
                Files Uploaded This Session:
              </p>
              <p className="text-lg font-bold text-blue-600">
                {uploadedFiles.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Uploaded Files ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((fileUrl, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={fileUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="font-medium">File {index + 1}</p>
                    <p className="text-gray-500 truncate">{fileUrl}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(fileUrl, "_blank")}
                    className="w-full"
                  >
                    View File
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About This Demo */}
      <Card>
        <CardHeader>
          <CardTitle>About This Upload Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">
              What is this page?
            </h4>
            <p className="text-sm text-blue-700">
              This is a <strong>testing and development page</strong> that shows
              how file uploads work. It's mainly for developers to test the
              upload system and see examples of future features.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Current File Upload Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-3 rounded">
                <h5 className="font-medium text-green-600 mb-1">✓ Live Now</h5>
                <p className="text-sm">
                  <strong>Profile Pictures:</strong> Account page → Profile tab
                </p>
                <p className="text-sm text-gray-600">
                  Users can upload and save avatar images
                </p>
              </div>
              <div className="border p-3 rounded">
                <h5 className="font-medium text-orange-600 mb-1">
                  🚧 Future Feature
                </h5>
                <p className="text-sm">
                  <strong>Contest Banners:</strong> When creating contests
                </p>
                <p className="text-sm text-gray-600">
                  Admins will add banner images to contests
                </p>
              </div>
              <div className="border p-3 rounded">
                <h5 className="font-medium text-orange-600 mb-1">
                  🚧 Future Feature
                </h5>
                <p className="text-sm">
                  <strong>Documents:</strong> Rules, receipts, reports
                </p>
                <p className="text-sm text-gray-600">
                  File attachments for contests and admin use
                </p>
              </div>
              <div className="border p-3 rounded">
                <h5 className="font-medium text-blue-600 mb-1">⚙️ Technical</h5>
                <p className="text-sm">
                  <strong>Storage:</strong> Local dev, cloud production
                </p>
                <p className="text-sm text-gray-600">
                  Automatic environment detection
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                Need Help with Upload Errors?
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>
                  • <strong>File too large:</strong> Contest banners max 15MB,
                  profiles max 5MB
                </li>
                <li>
                  • <strong>Wrong format:</strong> Use JPG, PNG, GIF for images
                </li>
                <li>
                  • <strong>Upload failed:</strong> Check file size and internet
                  connection
                </li>
                <li>
                  • <strong>Wallpaper images:</strong> Often very large - try
                  resizing first
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
