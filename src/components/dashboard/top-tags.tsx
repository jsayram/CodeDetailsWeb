"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface TopTagsProps {
  data: {
    name: string;
    count: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function TopTags({ data }: TopTagsProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} projects`, "Count"]}
            labelFormatter={(label: string) => `Tag: ${label}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-1">
        {data.map((tag, index) => (
          <div key={tag.name} className="flex items-center gap-2 text-sm">
            <div 
              className="h-3 w-3 rounded"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{tag.name}</span>
            <span className="text-muted-foreground ml-auto">{((tag.count / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}