import React from "react";

interface GenericLoadingStateProps {
  type?: "card" | "list" | "table" | "block";
  lines?: number;
  className?: string;
  itemsCount?: number;
}

export function GenericLoadingState({
  type = "block",
  lines = 3,
  className = "",
  itemsCount = 1,
}: GenericLoadingStateProps) {
  const renderLine = (i: number, total: number) => (
    <div
      key={i}
      className="h-4 bg-muted rounded animate-pulse"
      style={{
        width: i === 0 ? "100%" : i === total - 1 ? "70%" : "85%",
        animationDelay: `${i * 100}ms`,
      }}
    ></div>
  );

  const renderCard = (index: number) => (
    <div
      key={index}
      className="w-full p-4 border rounded-md skeleton-fade"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-6 bg-muted rounded w-3/4 mb-4 animate-pulse"></div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => renderLine(i, lines))}
      </div>
      <div className="flex justify-end mt-4">
        <div className="h-8 bg-muted rounded-md w-24 animate-pulse"></div>
      </div>
    </div>
  );

  const renderBlock = () => (
    <div className="space-y-3 p-4 border rounded-md skeleton-fade">
      <div className="h-8 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => renderLine(i, lines))}
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="border rounded-md overflow-hidden skeleton-fade">
      {/* Table header */}
      <div className="p-3 bg-muted/30 flex">
        {[30, 20, 15, 35].map((width, i) => (
          <div
            key={i}
            className="h-6 bg-muted rounded animate-pulse"
            style={{
              width: `${width}%`,
              marginRight: "8px",
              animationDelay: `${i * 100}ms`,
            }}
          ></div>
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: itemsCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-3 flex border-t"
          style={{ animationDelay: `${rowIndex * 50}ms` }}
        >
          {[30, 20, 15, 35].map((width, i) => (
            <div
              key={i}
              className="h-5 bg-muted rounded animate-pulse"
              style={{
                width: `${width}%`,
                marginRight: "8px",
                animationDelay: `${rowIndex * 50 + i * 100}ms`,
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-3 skeleton-fade">
      {Array.from({ length: itemsCount }).map((_, i) => (
        <div
          key={i}
          className="p-3 flex border rounded-md"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-10 w-10 bg-muted rounded-full animate-pulse mr-3"></div>
          <div className="flex-1 space-y-2">
            <div
              className="h-5 bg-muted rounded animate-pulse w-1/3"
              style={{ animationDelay: `${i * 50 + 100}ms` }}
            ></div>
            <div
              className="h-4 bg-muted rounded animate-pulse w-3/4"
              style={{ animationDelay: `${i * 50 + 200}ms` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`animate-in fade-in-50 ${className}`}>
      {type === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: itemsCount }).map((_, i) => renderCard(i))}
        </div>
      )}
      {type === "block" && renderBlock()}
      {type === "table" && renderTable()}
      {type === "list" && renderList()}
    </div>
  );
}
