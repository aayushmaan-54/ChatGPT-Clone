"use client";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useSignUp } from "@clerk/nextjs";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import handleErrorClient from "~/common/utils/handle-error-client";
import FloatingLabelInput from "~/common/components/floating-label-input";
import Icons from "~/common/icons/icons";



export default function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const router = useRouter();

  // Ensure Clerk is loaded before rendering the component
  useEffect(() => {
    if (!isLoaded) return;
  }, [isLoaded]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setDisabled(true);

    try {
      // Attempt to create a new user with email and password
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      handleErrorClient(err);
    } finally {
      setDisabled(false);
    }
  };


  const onPressVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setDisabled(true);

    try {
      // Attempt to verify the email address with the provided code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/');
      }
    } catch (err) {
      handleErrorClient(err);
    } finally {
      setDisabled(false);
    }
  };


  // Handle OAuth sign-up with redirect
  const handleOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_microsoft' | 'oauth_apple') => {
    if (!isLoaded) return;

    setOauthLoading(strategy);

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL as string,
      });
    } catch (err) {
      handleErrorClient(err);
      setOauthLoading(null);
    }
  };


  // If the user is pending verification, show the verification form
  if (pendingVerification) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-md">
          <h2 className="font-semibold text-2xl mb-4">Verify Your Email</h2>
          <p className="mb-6 text-muted-foreground/50">We&apos;ve sent a verification code to {email}</p>

          <form onSubmit={onPressVerify}>
            <FloatingLabelInput
              label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={disabled}
              className="bg-transparent!"
            />
            <Button
              type="submit"
              disabled={disabled}
              className="w-full mt-6 py-6 text-base rounded-full"
            >
              {disabled ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="flex flex-col items-center justify-center mt-20">
        <h1 className="font-semibold text-3xl mb-10">Create an account</h1>

        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <div className="w-full max-w-md">
            <FloatingLabelInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              required
              className="bg-transparent!"
            />

            <div className="mt-5">
              <FloatingLabelInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
                required
                className="bg-transparent!"
              />
            </div>
          </div>

          <Button
            className="w-full mt-6 py-6 text-base rounded-full"
            type="submit"
            disabled={disabled || !email || !password}
          >
            {disabled ? 'Creating Account...' : 'Continue'}
          </Button>
        </form>

        <div className="mt-5">
          Already have an account? <Link href='/auth/login' className="text-auth-link hover:underline">Log in</Link>
        </div>

        <div className="relative w-full max-w-md h-[1px] bg-accent-foreground/30 my-7">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground/50">OR</span>
        </div>

        <div className="w-full max-w-md">
          <Button
            variant={'outline'}
            className="w-full mt-6 py-6 text-base rounded-full"
            onClick={() => handleOAuthSignUp('oauth_google')}
            disabled={oauthLoading !== null}
          >
            <Icons.Google />
            {oauthLoading === 'oauth_google' ? 'Connecting...' : 'Continue with Google'}
          </Button>

          <Button
            variant={'outline'}
            className="w-full mt-6 py-6 text-base rounded-full"
            onClick={() => handleOAuthSignUp('oauth_microsoft')}
            disabled={oauthLoading !== null}
          >
            <Icons.Microsoft />
            {oauthLoading === 'oauth_microsoft' ? 'Connecting...' : 'Continue with Microsoft account'}
          </Button>

          <Button
            variant={'outline'}
            className="w-full mt-6 py-6 text-base rounded-full"
            onClick={() => handleOAuthSignUp('oauth_apple')}
            disabled={oauthLoading !== null}
          >
            <Icons.Apple />
            {oauthLoading === 'oauth_apple' ? 'Connecting...' : 'Continue with Apple'}
          </Button>
        </div>
      </div>
    </>
  )
}
