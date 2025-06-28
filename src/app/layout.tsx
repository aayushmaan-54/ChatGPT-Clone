import type { Metadata } from "next";
import localFont from 'next/font/local';
import { SidebarProvider } from "~/components/ui/sidebar";
import ThemeProvider from "~/common/provider/theme-provider";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AppSidebar from "~/common/components/app-sidebar";
import { PromptDataProvider } from "~/common/provider/prompt-data-provider";



export const openAISans = localFont({
  src: [{
    path: '../../public/fonts/openai-sans/OpenAISans-Regular.woff2',
    weight: '400',
    style: 'normal',
  },
  {
    path: '../../public/fonts/openai-sans/OpenAISans-Medium.woff2',
    weight: '500',
    style: 'normal',
  },
  {
    path: '../../public/fonts/openai-sans/OpenAISans-Semibold.woff2',
    weight: '600',
    style: 'normal',
  },
  {
    path: '../../public/fonts/openai-sans/OpenAISans-Bold.woff2',
    weight: '700',
    style: 'normal',
  }],
  variable: '--font-openai-sans',
  display: 'swap',
});


export const metadata: Metadata = {
  metadataBase: new URL("https://chatgptclone45.vercel.app"),
  title: {
    default: "ChatGPT Clone",
    template: "ChatGPT Clone | %s",
  },
  description:
    "A pixel-perfect clone of ChatGPT with message editing, memory, file uploads, streaming, and more — built using Next.js, Vercel AI SDK, and modern full-stack technologies.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "ChatGPT Clone - Fullstack AI Chat App",
    description:
      "Experience ChatGPT UI with memory, streaming, context window handling, file upload, message editing, and full-stack integration.",
    url: "https://chatgptclone45.vercel.app",
    siteName: "ChatGPT Clone",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ChatGPT Clone - Fullstack AI Chat App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatGPT Clone - Fullstack AI Chat App",
    description:
      "A pixel-perfect ChatGPT replica with memory, file uploads, Vercel AI SDK, and seamless OpenAI integration. Built for developers.",
    images: ["/og-image.png"],
  },
  keywords: [
    "ChatGPT Clone",
    "AI Chat App",
    "Vercel AI SDK",
    "Streaming Chat Messages",
    "Chat UI Clone",
    "OpenAI GPT Clone",
    "Next.js Chat App",
    "Clerk Auth",
    "mem0 Memory AI",
    "Chat with File Upload",
    "Edit Sent Messages",
    "Fullstack ChatGPT Clone",
    "Context Window Token Limit",
    "Pixel Perfect Chat UI",
    "GPT-4-turbo Integration",
    "Chat Message Streaming",
    "Tailwind Chat UI",
    "Modern AI Assistant UI",
    "Next.js OpenAI App",
    "Chatbot with Memory",
    "AI Chat App Design",
    "OpenAI Powered Chat App",
    "Frontend for GPT Models",
    "Clone of ChatGPT UX",
    "Advanced Chat Interface",
  ],
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`antialiased ${openAISans.variable}`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <SidebarProvider defaultOpen={false}>
              <SignedIn>
                <AppSidebar />
              </SignedIn>
              <PromptDataProvider>
                {children}
              </PromptDataProvider>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
