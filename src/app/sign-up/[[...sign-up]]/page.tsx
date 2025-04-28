"use client";
import { SignUp } from "@clerk/nextjs";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { FooterSection } from "@/components/layout/FooterSection";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSectionNoSideBar />
      <main className="flex-grow flex items-center justify-center relative">
        <CodeParticlesElement />
        <div className="z-10">
          <SignUp />
        </div>
      </main>
      <FooterSection />
    </div>
  );
}