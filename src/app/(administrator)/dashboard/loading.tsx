import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";



export default function UserDashboardLoading() {
  return (
    <main className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
      {/* Dashboard Banner - matches real structure */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-end mb-2">
            <Skeleton className="h-8 w-20 rounded-md" /> {/* Refresh button */}
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/50 rounded-2xl shadow-lg px-6 py-4 w-full border border-muted">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-lg" /> {/* Icon */}
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 gap-2">
              <Skeleton className="h-8 w-80" /> {/* Title */}
              <Skeleton className="h-4 w-96" /> {/* Description */}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row - exact match */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="scroll-mt-20">
            <Card className="h-[250px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center">
                <Skeleton className="h-12 w-12 mb-2" />
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Main Content - Three Columns - exact match */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {/* Recent Appreciation Card */}
        <Card className="md:col-span-2 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Recent Activity Card */}
        <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-2 rounded-lg">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Popular Tags Card */}
        <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <Skeleton className="h-3 w-52" />
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
            <div className="border rounded-lg p-3 mt-3">
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Projects Section - exact match */}
      <Card className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-[200px] 3xl:h-[440px] flex flex-col relative">
                <Skeleton className="absolute top-3 left-3 h-6 w-16 rounded-full" />
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
                  <div className="flex flex-col justify-between h-full">
                    <Skeleton className="h-5 w-4/5 mb-3" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Projects I've Favorited - conditional section */}
      <Card className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
          <div className="flex-1">
            <Skeleton className="h-6 w-60 mb-1" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-[200px] 3xl:h-[440px] flex flex-col relative">
                <Skeleton className="absolute top-3 left-3 h-6 w-16 rounded-full" />
                <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
                  <div className="flex flex-col justify-between h-full">
                    <Skeleton className="h-5 w-4/5 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* My Tag Submissions - exact match */}
      <Card className="flex flex-col h-[600px] 3xl:h-[1200px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
          <div className="flex-1">
            <Skeleton className="h-5 w-44 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-y-auto">
          {/* Accordion skeleton */}
          <div className="border border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 via-purple/5 to-primary/5 mb-6">
            <div className="px-4 py-3 flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          
          {/* Three columns for tag submissions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, colIdx) => (
              <div key={colIdx}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-full rounded-md mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
