import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      theme="system"
      closeButton
      className="toaster-custom"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "0.75rem 1rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
        classNames: {
          success: "toast-success",
          error: "toast-error",
          loading: "toast-loading",
          info: "toast-info",
          warning: "toast-warning",
          default: "toast-default",
        },
      }}
    />
  );
}
