"use client";

import { useState, useEffect } from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { PageBanner } from "@/components/ui/page-banner";
import { Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import { SharedProjectsGrid } from "@/components/Projects/SharedProjectsGrid";

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
      <HeaderSection />
      <div className="flex justify-center w-full mb-20">
        <div className="w-full max-w-7xl px-4">
          <div className="flex flex-col gap-4 mb-6 py-3">
            <div className="mb-8">
              <div className="flex flex-col space-y-4">
                <PageBanner
                  icon={<Share2 className="h-8 w-8 text-purple-500" />}
                  userName={decodedUsername}
                  bannerTitle={`${decodedUsername}'s Projects`}
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
