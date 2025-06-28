import "./auth.module.css";



export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="auth-body font-openai-sans flex flex-col mt-10 w-full max-w-7xl mx-auto px-4">
      <h1 className="font-black text-3xl">ChatGPT Clone</h1>
      {children}
    </section>
  );
}
