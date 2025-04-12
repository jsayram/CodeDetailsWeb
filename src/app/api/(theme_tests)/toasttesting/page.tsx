"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Clock, 
  X, 
  ArrowRight,
  Loader2 
} from "lucide-react";
import { DarkModeButton } from "@/components/DarkModeButtonComponent";

export default function ToastTestingPage() {
  // Function to generate a toast with the desired duration
  const createPersistentToast = (type: string, duration: number = 10000) => {
    // Use appropriate toast method based on type
    switch (type.toLowerCase()) {
      case 'success':
        toast.success(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Success Toast
            </div>
            <div className="text-sm opacity-90">Your changes have been saved successfully.</div>
          </div>, 
          { duration }
        );
        break;
      case 'error':
        toast.error(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Error Toast
            </div>
            <div className="text-sm opacity-90">There was a problem processing your request.</div>
          </div>, 
          { duration }
        );
        break;
      case 'warning':
        toast(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
              Warning Toast
            </div>
            <div className="text-sm opacity-90">Your subscription will expire in 7 days.</div>
          </div>, 
          { 
            duration, 
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> 
          }
        );
        break;
      case 'info':
        toast(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <Info className="mr-2 h-4 w-4 text-blue-500" />
              Information Toast
            </div>
            <div className="text-sm opacity-90">This feature is currently in beta testing.</div>
          </div>, 
          { 
            duration, 
            icon: <Info className="h-5 w-5 text-blue-500" /> 
          }
        );
        break;
      case 'loading':
        toast.loading(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Toast
            </div>
            <div className="text-sm opacity-90">Please wait while we process your request.</div>
          </div>, 
          { duration }
        );
        break;
      case 'promise':
        // Simulate an async operation with promise
        const promise = new Promise<{ name: string }>((resolve) => {
          setTimeout(() => resolve({ name: 'Dark Mode Test' }), 2000);
        });
        
        toast.promise(promise, {
          loading: 'Loading data...',
          success: (data: { name: string }): string => `Successfully loaded ${data.name}!`,
          error: 'Failed to load data.',
          duration,
        });
        break;
      case 'custom':
        toast(
          <div className="flex flex-col gap-1">
            <div className="font-medium">Custom Toast with Actions</div>
            <div className="text-sm opacity-90">You can customize toasts with actions.</div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
                Dismiss
              </Button>
              <Button size="sm" variant="default" onClick={() => toast("Action clicked!")}>
                Action <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>,
          { duration }
        );
        break;
      case 'persistent':
        toast(
          <div className="flex flex-col gap-1">
            <div className="font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Persistent Toast
            </div>
            <div className="text-sm opacity-90">
              This toast will remain until manually dismissed.
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
                  Dismiss <X className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>,
          { duration: 100000 } // Very long duration
        );
        break;
      default:
        toast(
          <div className="flex flex-col gap-1">
            <div className="font-medium">Default Toast</div>
            <div className="text-sm opacity-90">This is a default toast notification.</div>
          </div>, 
          { duration }
        );
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 ease-in-out">
      <header className="p-4 border-b border-border flex justify-between items-center">
        <h1 className="text-xl font-bold">Toast Testing Playground</h1>
          <DarkModeButton />
      </header>

      <main className="p-4 space-y-8 max-w-4xl mx-auto">
        <section className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Toast Types</h2>
          <p className="text-muted-foreground mb-6">
            Click the buttons below to test different toast notifications. Each toast will persist for 10 seconds
            to give you time to see how it looks in your current theme.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button onClick={() => createPersistentToast('default')} variant="outline" className="flex-col h-auto py-4">
              <span>Default</span>
              <span className="text-xs text-muted-foreground mt-1">Standard Toast</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('success')} variant="outline" className="flex-col h-auto py-4" >
              <span className="flex items-center">
                <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                Success
              </span>
              <span className="text-xs text-muted-foreground mt-1">Operation completed</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('error')} variant="outline" className="flex-col h-auto py-4">
              <span className="flex items-center">
                <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
                Error
              </span>
              <span className="text-xs text-muted-foreground mt-1">Something went wrong</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('warning')} variant="outline" className="flex-col h-auto py-4">
              <span className="flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500" />
                Warning
              </span>
              <span className="text-xs text-muted-foreground mt-1">User attention needed</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('info')} variant="outline" className="flex-col h-auto py-4">
              <span className="flex items-center">
                <Info className="mr-1 h-4 w-4 text-blue-500" />
                Info
              </span>
              <span className="text-xs text-muted-foreground mt-1">For your information</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('loading')} variant="outline" className="flex-col h-auto py-4">
              <span className="flex items-center">
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Loading
              </span>
              <span className="text-xs text-muted-foreground mt-1">Processing request</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('promise')} variant="outline" className="flex-col h-auto py-4">
              <span>Promise</span>
              <span className="text-xs text-muted-foreground mt-1">Async operation</span>
            </Button>
            
            <Button onClick={() => createPersistentToast('custom')} variant="outline" className="flex-col h-auto py-4">
              <span>Custom</span>
              <span className="text-xs text-muted-foreground mt-1">With actions</span>
            </Button>

            <Button onClick={() => createPersistentToast('persistent')} variant="outline" className="flex-col h-auto py-4">
              <span className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Persistent
              </span>
              <span className="text-xs text-muted-foreground mt-1">Manual dismiss</span>
            </Button>

            <Button 
              onClick={() => {
                createPersistentToast('success');
                createPersistentToast('error');
                createPersistentToast('warning');
                createPersistentToast('info');
              }} 
              className="col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Show Multiple Toasts
            </Button>

            <Button 
              onClick={() => toast.dismiss()} 
              className="col-span-1 md:col-span-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Dismiss All
            </Button>
          </div>
        </section>

        <section className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Toast Duration</h2>
          <p className="text-muted-foreground mb-6">
            Test how different durations affect your toasts.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => toast.success("Quick success toast", { duration: 2000 })}>
              Short (2s)
            </Button>
            <Button onClick={() => toast.success("Medium success toast", { duration: 5000 })}>
              Medium (5s)
            </Button>
            <Button onClick={() => toast.success("Long success toast", { duration: 10000 })}>
              Long (10s)
            </Button>
          </div>
        </section>
      </main>

      <footer className="p-4 text-center border-t border-border mt-8">
        <p className="text-sm text-muted-foreground">
          Toast Testing Page © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}