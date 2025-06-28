/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "~/components/ui/button";
import "./prompt-input.module.css";
import { useRef, useEffect, useState } from 'react';
import { cn } from "~/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import toast from "react-hot-toast";
import axios from 'axios';
import { Plus, Square } from "lucide-react";
import { UploadedFile } from "~/common/types/types";
import { PromptInputProps } from "~/common/types/props.types";
import handleErrorClient from "~/common/utils/handle-error-client";
import FileItem from "./_components/file-item";
import Icons from "~/common/icons/icons";



export default function PromptInput({
  prompt,
  setPrompt,
  inputRef,
  files,
  setFiles,
  onSubmit,
  disabled = false
}: PromptInputProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILE_COUNT = 5;


  useEffect(() => { // Sync prompt with contentEditable
    if (contentEditableRef.current) {
      const currentContent = contentEditableRef.current.innerText;
      if (currentContent !== prompt) {
        if (prompt === "") {
          contentEditableRef.current.innerHTML = "";
        } else {
          contentEditableRef.current.innerText = prompt;
        }
      }
    }
  }, [prompt]);


  const handleInput = () => { // Handle input changes in contentEditable
    if (contentEditableRef.current) {
      const text = contentEditableRef.current.innerText.trim();
      setPrompt(text);

      if (text === "" && contentEditableRef.current.innerHTML !== "") {
        contentEditableRef.current.innerHTML = "";
      }
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => { // Handle keydown events in contentEditable
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        const currentText = contentEditableRef.current?.innerText.trim() || '';
        if (currentText || files.length > 0) {
          onSubmit(currentText);
        }
      }
    }
  };


  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => { // Handle paste events in contentEditable
    const clipboardData = e.clipboardData;

    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();

      const pastedFiles: UploadedFile[] = [];
      let totalFiles = files.length;
      let totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          totalFiles += 1;
          totalSize += file.size;

          if (totalFiles > MAX_FILE_COUNT) {
            toast.error(`You can upload a maximum of ${MAX_FILE_COUNT} files.`);
            return;
          }

          if (totalSize > MAX_TOTAL_SIZE) {
            toast.error('Total upload size cannot exceed 10 MB.');
            return;
          }

          const uploadedFile: UploadedFile = {
            id: uuidv4(),
            file: file,
            filePreview: URL.createObjectURL(file),
            uploadProgress: 0,
            isUploading: false,
            mimeType: file.type,
            filename: file.name,
            size: file.size
          };
          pastedFiles.push(uploadedFile);
        }
      }

      if (pastedFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...pastedFiles]);
        pastedFiles.forEach(file => uploadToCloudinary(file));
        toast.success(`${pastedFiles.length} image${pastedFiles.length > 1 ? 's' : ''} pasted successfully`);
      }

      return;
    }

    setTimeout(() => {
      handleInput();
    }, 0);
  };


  const handleOpenFilePicker = () => { // Open file picker dialog
    if (inputRef.current) {
      inputRef.current.click();
    }
  };


  const handleFiles = () => { // Valdiate files selected from file input
    if (inputRef.current && inputRef.current.files) {
      const selectedFiles = Array.from(inputRef.current.files);
      const totalFiles = files.length + selectedFiles.length;

      if (totalFiles > MAX_FILE_COUNT) {
        toast.error(`You can upload a maximum of ${MAX_FILE_COUNT} files.`);
        return;
      }

      const totalSize = files.reduce((acc, f) => acc + f.file.size, 0) + selectedFiles.reduce((acc, f) => acc + f.size, 0);

      if (totalSize > MAX_TOTAL_SIZE) {
        toast.error('Total upload size cannot exceed 10 MB.');
        return;
      }

      const newFiles: UploadedFile[] = selectedFiles.map((file) => ({ // Create new UploadedFile object for each selected file
        id: uuidv4(),
        file: file,
        filePreview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        uploadProgress: 0,
        isUploading: false,
        mimeType: file.type,
        filename: file.name,
        size: file.size
      }));

      setFiles([...files, ...newFiles]); // Update state with new files
      newFiles.forEach(file => uploadToCloudinary(file)); // Upload each new file to Cloudinary
    }
  };


  const uploadToCloudinary = async (file: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', file.file);
    setIsFileUploading(true);

    try {
      setFiles(prevFiles => // Update file state to indicate uploading
        prevFiles.map(f =>
          f.id === file.id
            ? {
              ...f,
              isUploading: true,
              uploadProgress: 0
            }
            : f
        ) as UploadedFile[]
      );

      const response = await axios.post('/api/upload-file', formData, { // Send file to Cloudinary
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => { // Track upload progress
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setFiles(prevFiles => // Update file state with upload progress
            prevFiles.map(f =>
              f.id === file.id
                ? {
                  ...f,
                  uploadProgress: percentCompleted
                }
                : f
            ) as UploadedFile[]
          );
        },
      });

      const data = response.data; // Get response data from Cloudinary

      setFiles(prevFiles => // Update file state with final upload details
        prevFiles.map(f =>
          f.id === file.id
            ? {
              ...f,
              publicId: data.public_id,
              isUploading: false,
              uploadProgress: 100,
              url: data.secure_url
            }
            : f
        ) as UploadedFile[]
      );
    } catch (error: any) {
      setFiles(prevFiles => // Update file state to indicate upload failure
        prevFiles.map(f =>
          f.id === file.id
            ? {
              ...f,
              isUploading: false,
              uploadProgress: 0,
              error: error.response?.data?.error || 'Upload failed'
            }
            : f
        ) as UploadedFile[]
      );
      handleErrorClient(error);
    } finally {
      setIsFileUploading(false);
      if (file.filePreview) {
        URL.revokeObjectURL(file.filePreview); // Clean up object URL to prevent memory leaks
      }
      if (inputRef.current) {
        inputRef.current.value = ''; // Reset file input value to allow re-uploading the same file
      }
    }
  };


  const removeFile = async (id: string) => {
    const fileToRemove = files.find(f => f.id === id); // Find the file to remove by ID
    if (!fileToRemove) return;

    if (fileToRemove.publicId) {
      try {
        await toast.promise(
          axios.delete('/api/delete-upload', { // Send request to delete file from Cloudinary
            data: { public_id: fileToRemove.publicId }
          }),
          {
            loading: 'Deleting file...',
            success: 'File deleted successfully',
            error: 'Failed to delete file'
          }
        );
      } catch (error) {
        handleErrorClient(error);
        return;
      }
    }

    if (fileToRemove.filePreview) {
      URL.revokeObjectURL(fileToRemove.filePreview); // Clean up object URL to prevent memory leaks
    }

    setFiles(files.filter(f => f.id !== id)); // Update state to remove the file
  };


  const handleStreamingSubmit = async () => { // Handle form submission with streaming
    if (!prompt.trim() && files.length === 0) {
      toast.error('Please enter a prompt or upload a file before submitting.');
      return;
    }

    if (isFileUploading) {
      toast.error('Please wait for all files to finish uploading before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit(prompt);
      setPrompt('');
      setFiles([]);
    } catch (err) {
      handleErrorClient(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <div className={cn("w-full max-w-2xl min-w-[200px] min-h-[1vh] max-h-[34vh] bg-input/30 rounded-4xl flex flex-col p-2 pr-3 shadow-lg", files.length > 0 && "pt-5")}>
        <div className={cn("flex-none px-4")}>
          <div className={cn("flex gap-2 overflow-clip", files.length > 0 && "pt-1")}>
            {files.length > 0 && (
              files.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  onRemove={() => removeFile(file.id)}
                />
              ))
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            multiple
            accept=".pdf,.doc,.docx,.rtf,.epub,.odt,.odp,.pptx,.txt,.py,.ipynb,.js,.jsx,.html,.css,.java,.cs,.php,.c,.cc,.cpp,.cxx,.cts,.h,.hh,.hpp,.rs,.R,.Rmd,.swift,.go,.rb,.kt,.kts,.ts,.tsx,.m,.mm,.mts,.scala,.rs,.dart,.lua,.pl,.pm,.t,.sh,.bash,.zsh,.csv,.log,.ini,.cfg,.config,.json,.proto,.yaml,.yml,.toml,.lua,.sql,.bat,.md,.coffee,.tex,.latex,.gd,.gdshader,.tres,.tscn,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFiles}
          />
        </div>

        <div
          ref={contentEditableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning={true}
          role="textbox"
          aria-label="Prompt input"
          data-placeholder="Ask anything..."
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={`flex-grow w-full h-full focus:outline-none px-4 py-2 overflow-y-auto scrollbar-thin resize-none min-h-[40px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        <div className="flex-none flex justify-between items-center px-2 py-2">
          <Button
            className="rounded-full hover:rounded-full size-10 disabled:cursor-not-allowed"
            variant="ghost"
            onClick={handleOpenFilePicker}
            disabled={disabled}
          >
            <Plus />
          </Button>
          <Button
            className="rounded-full hover:rounded-full size-10 bg-primary text-primary-foreground disabled:cursor-not-allowed"
            onClick={handleStreamingSubmit}
            disabled={!prompt.trim() || isFileUploading || isSubmitting || disabled}
            aria-label="Send"
          >
            {isSubmitting ? <Square className="size-5 fill-primary-foreground" /> : <Icons.UpArrow className="size-5" />}
          </Button>
        </div>
      </div>
    </>
  );
}
