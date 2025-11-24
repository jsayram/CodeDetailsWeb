"use client";

import { useState, useEffect } from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { PageBanner } from "@/components/ui/page-banner";
import { Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import { SharedProjectsGrid } from "@/components/Projects/SharedProjectsGrid";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

export default function SharedProjects() {
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);
  const params = useParams();
  const username = params?.username as string;

  if (!username) {
    return <div>Invalid username</div>;
  }

  const decodedUsername = decodeURIComponent(username);

  return (
    <div>
      <HeaderSectionNoSideBar showMobileMenu={false} showSignInButton={true} />
      <div className="flex justify-center w-full mb-20">
        <div className="w-full px-4 2xl:px-8 3xl:px-12">
          <div className="flex flex-col gap-4 mb-6 py-3">
            <div className="mb-8">
              <div className="flex flex-col space-y-4">
                <PageBanner
                  icon={<Share2 className="h-8 w-8 text-purple-500" />}
                  userName={`${decodedUsername}`}
                  bannerTitle={`Shared Projects`}
                  description={
                    "Explore the projects shared by this user. You can find a variety of projects that showcase their skills and creativity."
                  }
                  gradientFrom="purple-900"
                  gradientVia="indigo-800"
                  gradientTo="violet-800"
                  borderColor="border-purple-700/40"
                  tierBgColor="bg-purple-700/60"
                  textGradient="from-purple-400 via-indigo-400 to-violet-400"
                />
                <SharedProjectsGrid
                  username={decodedUsername}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
