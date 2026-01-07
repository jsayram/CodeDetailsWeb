"use client";

import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { FooterSection } from "@/components/layout/FooterSection";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { SignUpComponent } from "@/components/auth/SignUpComponent";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderSectionNoSideBar showSignInButton={false} showMobileMenu={false} />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden py-8">
        <CodeParticlesElement />
        <div className="w-full max-w-md mx-auto px-4 relative z-10 background-blur-sm">
          <SignUpComponent
            withTitle={true}
            withIcon={false}
            titleText="Join Code Details"
            subTitleText="Create your account to get started with Code Details."
          />
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
