import { File, FileImage, FileSpreadsheet, FileText } from "lucide-react";
import Image from "next/image";
import { PromptFileItemProps } from "~/common/types/props.types";



export default function PromptFileItem({ fileData }: PromptFileItemProps) {
  // Get file preview icon
  const getFilePreviewIcon = () => {
    const { mimeType, cloudinaryUrl, fileName } = fileData;

    if (mimeType.startsWith("image/")) {
      if (cloudinaryUrl) {
        return (
          <Image
            src={cloudinaryUrl}
            alt={fileName}
            fill
            className="rounded-md object-cover"
          />
        );
      } else {
        return <FileImage className="text-gray-500" />;
      }
    } else if (mimeType === "application/pdf") {
      return <FileText className="text-red-600" />;
    } else if (mimeType.includes("word")) {
      return <FileText className="text-blue-600" />;
    } else if (mimeType.includes("excel")) {
      return <FileSpreadsheet className="text-green-600" />;
    } else if (mimeType.includes("powerpoint")) {
      return <FileText className="text-orange-600" />;
    } else if (mimeType.includes("text")) {
      return <FileText className="text-gray-500" />;
    } else {
      return <File className="text-gray-500" />;
    }
  };

  // Get file type label
  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("word")) return "Word";
    if (mimeType.includes("excel")) return "Excel";
    if (mimeType.includes("powerpoint")) return "PowerPoint";
    if (mimeType.includes("text")) return "Text";
    return "File";
  };

  // Truncates the file name while preserving the extension
  const truncateFileNameWithExtension = (name: string, maxLength: number) => {
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
    <>
      <div className="relative flex items-center p-2 rounded-md shadow-sm min-w-[180px] max-w-[250px] bg-muted-foreground/30">
        <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md bg-card mr-2">
          {getFilePreviewIcon()}
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <span className="text-sm font-medium break-all leading-tight">
            {truncateFileNameWithExtension(fileData.fileName, 25)}
          </span>
          <span className="text-xs text-muted-foreground">
            {getFileTypeLabel(fileData.mimeType)}
          </span>
        </div>
      </div>
    </>
  )
}
