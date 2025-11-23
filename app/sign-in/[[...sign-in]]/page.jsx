'use client'
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Logo */}
      <div className="mx-6 pt-6">
        <Link href="/" className="relative inline-block text-4xl font-semibold text-slate-700">
          <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
          <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
            plus
          </p>
        </Link>
      </div>

      {/* Auth Form Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <style jsx global>{`
          .cl-rootBox,
          .cl-card,
          .cl-main,
          .cl-form,
          .cl-formButtonPrimary,
          .cl-socialButtonsBlockButton,
          .cl-formFieldInput {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .cl-formButtonPrimary,
          .cl-socialButtonsBlockButton,
          .cl-formFieldInput,
          .cl-otpCodeFieldInput {
            border-radius: 9999px !important;
          }
          .cl-socialButtonsBlockButton {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
            border-color: rgba(226, 232, 240, 0.5) !important;
          }
        `}</style>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2">Welcome back</h1>
            <p className="text-slate-600">Sign in to your account to continue shopping</p>
          </div>

          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full [&>*]:!rounded-none",
                card: "shadow-none border-0 bg-transparent !rounded-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white border border-slate-200/50 text-slate-700 hover:bg-slate-50 rounded-full px-6 py-3 transition-all hover:scale-105 active:scale-95 !rounded-full shadow-sm",
                socialButtonsBlockButtonText: "text-slate-700 font-medium",
                socialButtonsBlockButtonArrow: "text-slate-600",
                dividerLine: "bg-slate-200",
                dividerText: "text-slate-500 text-sm",
                formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8 py-3 font-medium transition-all hover:scale-105 active:scale-95 !rounded-full",
                formFieldInput: "bg-slate-100 border-0 rounded-full px-5 py-3 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 !rounded-full",
                formFieldLabel: "text-slate-700 font-medium mb-2",
                identityPreviewEditButton: "text-indigo-500 hover:text-indigo-600",
                formResendCodeLink: "text-indigo-500 hover:text-indigo-600",
                footerActionLink: "text-indigo-500 hover:text-indigo-600 font-medium",
                formFieldAction: "text-indigo-500 hover:text-indigo-600",
                footerAction: "text-slate-600",
                footerActionText: "text-slate-600",
                alertText: "text-slate-700",
                formHeaderTitle: "hidden",
                formHeaderSubtitle: "hidden",
                formButtonReset: "!rounded-full",
                otpCodeFieldInput: "!rounded-full",
              },
              variables: {
                colorPrimary: "#6366f1",
                colorText: "#334155",
                colorTextSecondary: "#64748b",
                colorBackground: "#ffffff",
                colorInputBackground: "#f1f5f9",
                colorInputText: "#1e293b",
                borderRadius: "0px",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
}

