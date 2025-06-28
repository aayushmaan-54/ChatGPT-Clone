"use client";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import FloatingLabelInput from "~/common/components/floating-label-input";
import handleErrorClient from "~/common/utils/handle-error-client";
import { Button } from "~/components/ui/button";



export default function ForgotPassword() {
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);

  const router = useRouter();

  // Ensure Clerk is loaded before rendering the component
  useEffect(() => {
    if (!isLoaded) return;
  }, [isLoaded]);


  const sendResetCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setDisabled(true);

    try {
      // Attempt to create a reset password session with the provided email
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setSuccessfulCreation(true);
    } catch (err) {
      handleErrorClient(err);
    } finally {
      setDisabled(false);
    }
  };


  const confirmReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setDisabled(true);

    try {
      // Attempt to reset the password using the provided code and new password
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'needs_second_factor') {
        setSecondFactor(true);
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      }
    } catch (err) {
      handleErrorClient(err);
    } finally {
      setDisabled(false);
    }
  };


  // Render the form for sending reset code or confirming reset
  if (successfulCreation) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-md">
          <h2 className="font-semibold text-2xl mb-4">Check your email</h2>
          <p className="mb-6 text-muted-foreground/50">
            We&apos;ve sent a password reset code to <strong>{email}</strong>
          </p>

          <form onSubmit={confirmReset}>
            <FloatingLabelInput
              label="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={disabled}
              required
              className="bg-transparent!"
            />

            <div className="mt-5">
              <FloatingLabelInput
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
                required
                className="bg-transparent!"
              />
            </div>

            <Button
              type="submit"
              disabled={disabled || !code || !password}
              className="w-full mt-6 py-6 text-base rounded-full"
            >
              {disabled ? 'Resetting password...' : 'Reset password'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setSuccessfulCreation(false)}>
              Didn&apos;t receive the code? Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If the user has two-factor authentication enabled, show the 2FA prompt
  if (secondFactor) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-md">
          <h2 className="font-semibold text-2xl mb-4">Two-factor authentication</h2>
          <p className="mb-6 text-muted-foreground/50">
            Please enter your two-factor authentication code to complete the password reset.
          </p>

          <p className="text-sm text-muted-foreground/50">
            Two-factor authentication reset flow would be implemented here based on your 2FA setup.
          </p>

          <div className="mt-4">
            <Link href="/auth/login" className="text-auth-link hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-md">
          <h1 className="font-semibold text-3xl mb-4">Forgot your password?</h1>
          <p className="mb-8 text-muted-foreground/50">
            Enter your email address and we&apos;ll send you a code to reset your password.
          </p>

          <form onSubmit={sendResetCode}>
            <FloatingLabelInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              required
              className="bg-transparent!"
            />

            <Button
              type="submit"
              disabled={disabled || !email}
              className="w-full mt-6 py-6 text-base rounded-full"
            >
              {disabled ? 'Sending code...' : 'Send reset code'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-auth-link hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
