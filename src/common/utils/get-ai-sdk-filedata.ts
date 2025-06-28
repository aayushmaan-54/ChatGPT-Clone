import { FileAttachmentType } from "../models/schema";
import { AISDKFileData } from "../types/types";
import devLogger from "./dev-logger";



export default async function getAiSdkFileData(fileData: FileAttachmentType): Promise<{
  data: AISDKFileData;
  mimeType: string;
}> {
  const { cloudinaryUrl, mimeType } = fileData;
  const [primaryType] = mimeType.toLowerCase().split('/');
  try {
    switch (primaryType) {
      case 'image':
        return {
          data: new URL(cloudinaryUrl),
          mimeType
        };

      case 'audio':
      case 'video':
        return {
          data: new URL(cloudinaryUrl),
          mimeType
        };

      case 'text':
        const textResponse = await fetch(cloudinaryUrl);
        const textContent = await textResponse.text();
        const textBuffer = new TextEncoder().encode(textContent);
        return {
          data: textBuffer, // Uint8Array
          mimeType
        };

      case 'application':
        if (mimeType.includes('pdf')) {
          const pdfResponse = await fetch(cloudinaryUrl);
          const pdfBuffer = await pdfResponse.arrayBuffer();
          return {
            data: pdfBuffer,
            mimeType
          };
        } else if (mimeType.includes('json') || mimeType.includes('javascript')) {
          const appResponse = await fetch(cloudinaryUrl);
          const appContent = await appResponse.text();
          const appBuffer = new TextEncoder().encode(appContent);
          return {
            data: appBuffer,
            mimeType
          };
        } else if (mimeType.includes('msword') || mimeType.includes('openxml')) {
          const docResponse = await fetch(cloudinaryUrl);
          const docBuffer = await docResponse.arrayBuffer();
          return {
            data: docBuffer,
            mimeType
          };
        } else {
          const appResponse = await fetch(cloudinaryUrl);
          const appBuffer = await appResponse.arrayBuffer();
          return {
            data: appBuffer,
            mimeType
          };
        }

      default:
        const response = await fetch(cloudinaryUrl);
        const buffer = await response.arrayBuffer();
        return {
          data: buffer,
          mimeType
        };
    }
  } catch (error) {
    devLogger.warn(`Failed to fetch file content: ${error}`);
    return {
      data: new URL(cloudinaryUrl),
      mimeType
    };
  }
}
