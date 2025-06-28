# ChatGPT Clone
A pixel-perfect clone of ChatGPT with support for memory, file uploads, message editing, streaming responses, and more — built with modern full-stack technologies and Vercel AI SDK.

---

## 🚀 Features
- 💬 **ChatGPT-style UI/UX**
  - Fully responsive, ARIA-compliant, pixel-perfect layout
  - Message editing, smooth scrolling, modals, and animations
- 🧠 **AI Chat Engine**
  - Integrated with **Vercel AI SDK**
  - **Streaming responses** with typing effect
  - **Memory** and context management using `mem0.ai`
- 📁 **File & Image Uploads**
  - Upload and preview images (PNG, JPG)
  - Upload documents (PDF, DOCX, TXT)
- 🧾 **Account Management**
  - User authentication with **Clerk**
  - Conversation history per user
- ⚡ **Performance Optimizations**
  - Infinite scroll with pagination
  - Token counting for context management
  - Client-side state management

---

## 🛠 Tech Stack
| Layer           | Technology                       |
|-----------------|----------------------------------|
| Frontend        | Next.js (App Router), TypeScript |
| Styling         | Tailwind CSS, shadcn/ui          |
| Auth            | Clerk                            |
| Chat Backend    | Vercel AI SDK, OpenAI GPT        |
| Memory          | mem0.ai                          |
| Database        | MongoDB (via Mongoose)           |
| File Storage    | Cloudinary                       |
| State Management| Zustand                          |
| Token Counting  | js-tiktoken                      |
| Hosting         | Vercel                           |

---

## 🎯 Key Implementation Details
- **Context Management**: Intelligent token counting to maintain conversation context
- **File Processing**: Multi-format file upload with preview capabilities
- **Memory Integration**: Persistent conversation memory across sessions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication Flow**: Secure user management with Clerk

---

> Built with ❤️ for internship evaluation
