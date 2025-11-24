"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Heart, Tag as TagIcon, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface OverviewProps {
  data: {
    name: string;
    total: number;
    category?: string;
    tagCount?: number;
    owner?: string;
    createdAt?: string;
    slug?: string;
  }[];
}

export function Overview({ data }: OverviewProps) {
  const router = useRouter();

  return (
    <>
      {/* Chart view - Hidden on mobile */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${Math.max(800, data.length * 40)}px` }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={data}
                margin={{ top: 0, right: 20, bottom: 20, left: 20 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                  height={20}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[250px]">
                          <div className="space-y-2">
                            <div className="flex flex-col border-b pb-2">
                              <span className="text-[0.70rem] uppercase text-muted-foreground font-semibold">
                                Project
                              </span>
                              <span className="font-bold text-sm">{label}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Favorites
                                </span>
                                <span className="font-bold text-primary text-sm">
                                  {payload[0].value}
                                </span>
                              </div>
                              {data.tagCount !== undefined && (
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Tags
                                  </span>
                                  <span className="font-bold text-sm">
                                    {data.tagCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            {(data.category || data.owner) && (
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                {data.category && (
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Category
                                    </span>
                                    <span className="font-medium text-xs capitalize">
                                      {data.category}
                                    </span>
                                  </div>
                                )}
                                {data.owner && (
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Owner
                                    </span>
                                    <span className="font-medium text-xs">
                                      {data.owner}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {data.createdAt && (
                              <div className="flex flex-col pt-1 border-t">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Created
                                </span>
                                <span className="font-medium text-xs">
                                  {(() => {
                                    const date = typeof data.createdAt === 'string' 
                                      ? new Date(data.createdAt) 
                                      : data.createdAt;
                                    return date.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    });
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary cursor-pointer"
                  minPointSize={5}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      onClick={() => entry.slug && router.push(`/projects/${entry.slug}`)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table view - Visible on mobile */}
      <div className="md:hidden">
        <div className="space-y-3 max-h-[500px] overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {data.map((project, index) => (
            <div
              key={index}
              onClick={() => project.slug && router.push(`/projects/${project.slug}`)}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{project.name}</h4>
                  {project.category && (
                    <Badge variant="outline" className="text-xs capitalize w-fit">
                      {project.category}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Favorites:</span>
                    <span className="font-semibold">{project.total}</span>
                  </div>
                  {project.tagCount !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <TagIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Tags:</span>
                      <span className="font-semibold">{project.tagCount}</span>
                    </div>
                  )}
                </div>

                {(project.owner || project.createdAt) && (
                  <div className="flex flex-col gap-2 text-xs pt-2 border-t">
                    {project.owner && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-medium truncate">{project.owner}</span>
                      </div>
                    )}
                    {project.createdAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {new Date(project.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
