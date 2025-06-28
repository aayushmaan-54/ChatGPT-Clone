"use client";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { SidebarInset } from "~/components/ui/sidebar";
import { v4 as uuidv4 } from 'uuid';
import Header from "./_components/header";
import PromptInput from "~/common/components/prompt-input/prompt-input";
import SettingsDialog from "./_components/settings-dialog";
import IntroMessage from "./_components/intro-message";
import { UploadedFile } from "~/common/types/types";
import { FileAttachmentType } from "~/common/models/schema";
import { usePromptDataContext } from "~/common/provider/prompt-data-provider";
import { useRouter } from "next/navigation";



export default function Home() {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { setData } = usePromptDataContext();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);


  const onPromptSubmit = async (text: string) => {
    if (!text?.trim()) {
      toast.error("Please enter a prompt");
      return;
    };

    const conversationId = uuidv4();
    const prompt = userPrompt.trim();
    const files: FileAttachmentType[] = uploadedFiles.map(file => ({
      fileName: file.filename!,
      fileSize: file.size!,
      cloudinaryUrl: file.url!,
      mimeType: file.mimeType!,
    }));

    setData(prompt, files);
    router.push(`/c/${conversationId}`);
  };


  return (
    <>
      <SidebarInset>
        <div className="flex flex-col h-screen w-full">
          <Header />
          <SettingsDialog />

          <main className="flex-1 flex-col flex items-center mt-62 px-7 gap-7">
            <IntroMessage />
            <PromptInput
              prompt={userPrompt}
              setPrompt={setUserPrompt}
              files={uploadedFiles}
              setFiles={setUploadedFiles}
              inputRef={fileInputRef}
              onSubmit={onPromptSubmit}
            />
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
