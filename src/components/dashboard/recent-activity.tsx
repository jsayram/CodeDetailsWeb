import { Activity, Code, GitForkIcon } from "lucide-react";

interface RecentActivityProps {
  data: {
    id: string;
    title: string;
    action: string;
    username: string;
    timestamp: Date;
  }[];
}

export function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="space-y-8">
      {data.map((item) => (
        <div key={item.id} className="flex items-start">
          <div className="relative mr-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
              {item.action === "created" ? (
                <Code className="h-4 w-4" />
              ) : item.action === "updated" ? (
                <Activity className="h-4 w-4" />
              ) : (
                <GitForkIcon className="h-4 w-4" />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {item.username}
              <span className="text-muted-foreground"> {item.action} </span>
              {item.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(item.timestamp).toLocaleDateString("en-US", {
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}