"use client";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { AlertCircle, File, FileImage, FileSpreadsheet, FileText, X, Loader } from "lucide-react";
import { FileItemProps } from "~/common/types/props.types";



export default function FileItem({ file, onRemove }: FileItemProps) {
  const handleRemove = () => { // Handles the removal of a file item
    onRemove(file.id);
  };


  const getFilePreviewIcon = () => { // Returns the appropriate icon based on the file type
    const fileType = file.file.type;

    if (fileType.startsWith('image/')) {
      const imageUrl = file.url || file.filePreview;

      if (imageUrl) {
        return (
          <Image
            src={imageUrl}
            alt={file.file.name}
            fill
            className="rounded-md object-cover"
          />
        );
      } else {
        return <FileImage className="text-gray-500" />;
      }
    } else if (fileType === 'application/pdf') {
      return <FileText className="text-red-600" />;
    } else if (fileType.includes('word')) {
      return <FileText className="text-blue-600" />;
    } else if (fileType.includes('excel')) {
      return <FileSpreadsheet className="text-green-600" />;
    } else if (fileType.includes('powerpoint')) {
      return <FileText className="text-orange-600" />;
    } else if (fileType.includes('text')) {
      return <FileText className="text-gray-500" />;
    } else {
      return <File className="text-gray-500" />;
    }
  };


  const truncateFileNameWithExtension = (name: string, maxLength: number) => { // Truncates the file name while preserving the extension
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex === -1 || name.length <= maxLength) {
      return name;
    }

    const extension = name.substring(lastDotIndex);
    const fileNameWithoutExtension = name.substring(0, lastDotIndex);

    const maxFileNameLength = maxLength - extension.length;
    if (fileNameWithoutExtension.length > maxFileNameLength) {
      return `${fileNameWithoutExtension.substring(0, maxFileNameLength - 3)}...${extension}`;
    }
    return name;
  };


  return (
    <div className="relative flex items-center p-2 rounded-md shadow-sm min-w-[180px] max-w-[250px] bg-muted-foreground/30">
      <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md bg-card mr-2">
        {file.isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader className="size-4 text-muted-foreground animate-spin mb-1" />
          </div>
        ) : file.error ? (
          <AlertCircle className="size-6 text-destructive" />
        ) : (
          getFilePreviewIcon()
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <span className="text-sm font-medium break-all leading-tight">
          {truncateFileNameWithExtension(file.file.name, 25)}
        </span>
        {file.isUploading ? (
          <span className="text-xs text-muted-foreground">Uploading...</span>
        ) : file.error ? (
          <span className="text-xs text-destructive">Upload failed</span>
        ) : file.url ? (
          <span className="text-xs text-muted-foreground">Uploaded</span>
        ) : (
          <span className="text-xs text-muted-foreground">Ready</span>
        )}
      </div>

      <Button
        type="button"
        variant={'destructive'}
        size="icon"
        disabled={file.isUploading}
        onClick={handleRemove}
        className="absolute -top-1 -right-1 z-10 bg-destructive! hover:bg-destructive/90! rounded-full size-4"
        aria-label={`Remove ${file.file.name}`}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
