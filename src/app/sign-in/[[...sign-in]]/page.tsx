"use client";

import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { FooterSection } from "@/components/layout/FooterSection";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { SignInComponent } from "@/components/auth/SignInComponent";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderSectionNoSideBar showSignInButton={false} showMobileMenu={false} />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden py-8">
        <CodeParticlesElement />
        <div className="w-full max-w-md mx-auto px-4 relative z-10 background-blur-sm ">
          <SignInComponent withTitle={true}
           withIcon={false} 
           titleText="Hopefully you are not lost."
           subTitleText="Sign in to continue or create an account."
           />
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
