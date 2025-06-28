"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader } from "lucide-react";



export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader className="w-16 h-16 mx-auto mb-4 animate-spin" />
        <p className="text-lg font-bold">Completing sign up...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}
