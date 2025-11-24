"use client";

import React from "react";
import {
  Home,
  User,
  Moon,
  FileCode,
  BrainCircuit,
  Code,
  BookOpen,
  FolderGit2,
  Tag,
  Database,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

export default function DarkModeTestPage() {
  // Mock data for fake charts
  const barData = [75, 40, 65, 30];
  const lineData = [10, 25, 15, 30, 20, 40, 35];
  const pieData = [40, 30, 20, 10];

  return (
    <div className="flex flex-col">
      <HeaderSectionNoSideBar
        showDarkModeButton={true}
        showLogo={true}
        showMobileMenu={false}
        showSignInButton={true}
      />
      {/* Page container */}
      <div
        className="min-h-screen transition-colors duration-300 ease-in-out
                      bg-background text-foreground"
      >
        <main className="p-4 space-y-8 max-w-4xl mx-auto">
          {/* Icons Section */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Lucide Icons</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
              <div className="flex flex-col items-center">
                <Home className="text-primary" size={24} />
                <span className="text-xs mt-1">Home</span>
              </div>
              <div className="flex flex-col items-center">
                <User className="text-primary" size={24} />
                <span className="text-xs mt-1">User</span>
              </div>
              <div className="flex flex-col items-center">
                <Code className="text-primary" size={24} />
                <span className="text-xs mt-1">Code</span>
              </div>
              <div className="flex flex-col items-center">
                <BrainCircuit className="text-primary" size={24} />
                <span className="text-xs mt-1">AI</span>
              </div>
              <div className="flex flex-col items-center">
                <BookOpen className="text-primary" size={24} />
                <span className="text-xs mt-1">Docs</span>
              </div>
              <div className="flex flex-col items-center">
                <FolderGit2 className="text-primary" size={24} />
                <span className="text-xs mt-1">Projects</span>
              </div>
              <div className="flex flex-col items-center">
                <Tag className="text-primary" size={24} />
                <span className="text-xs mt-1">Tags</span>
              </div>
              <div className="flex flex-col items-center">
                <Database className="text-primary" size={24} />
                <span className="text-xs mt-1">Data</span>
              </div>
              <div className="flex flex-col items-center">
                <FileCode className="text-primary" size={24} />
                <span className="text-xs mt-1">Files</span>
              </div>
              <div className="flex flex-col items-center">
                <Moon className="text-primary" size={24} />
                <span className="text-xs mt-1">Dark</span>
              </div>
            </div>
          </section>

          {/* Headings Section */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Typography</h2>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">H1 Heading</h1>
              <h2 className="text-3xl font-semibold">H2 Heading</h2>
              <h3 className="text-2xl font-medium">H3 Heading</h3>
              <p className="mt-2 text-foreground">
                This is a sample paragraph to test how text looks in both modes.
                <span className="text-primary font-medium">
                  {" "}
                  Primary text
                </span>{" "}
                and
                <span className="text-secondary font-medium">
                  {" "}
                  secondary text
                </span>{" "}
                should be visible in both light and dark mode.
              </p>
              <p className="mt-2 text-muted-foreground">
                This is muted text for less important information.
              </p>
              <p className="mt-2">
                <span className="text-secondary font-semibold">
                  Secondary Text Example:
                </span>{" "}
                This text uses the secondary color for headings and important
                highlights.
              </p>
            </div>
          </section>

          {/* Alerts Section */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Alerts</h2>
            <div className="space-y-4">
              {/* Success Alert */}
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-md flex gap-3 items-start">
                <CheckCircle className="text-green-600 dark:text-green-400 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Success Alert
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your changes have been saved successfully.
                  </p>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-md flex gap-3 items-start">
                <Info className="text-blue-600 dark:text-blue-400 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">
                    Information Alert
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This feature is currently in beta testing.
                  </p>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md flex gap-3 items-start">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Warning Alert
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Your subscription will expire in 7 days.
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-md flex gap-3 items-start">
                <AlertCircle className="text-red-600 dark:text-red-400 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300">
                    Error Alert
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    There was a problem processing your request.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Fake Charts Section */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Charts</h2>

            {/* Bar Chart */}
            <div className="mb-8">
              <h3 className="text-md font-medium mb-2">Bar Chart</h3>
              <div className="h-40 flex items-end space-x-2">
                {barData.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-primary/80 hover:bg-primary transition-all rounded-t"
                      style={{ height: `${value}%` }}
                    ></div>
                    <span className="text-xs mt-1 text-muted-foreground">{`Item ${
                      index + 1
                    }`}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line Chart */}
            <div className="mb-8">
              <h3 className="text-md font-medium mb-2">Line Chart</h3>
              <div className="h-40 relative">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={lineData
                      .map(
                        (value, index) =>
                          `${index * (100 / (lineData.length - 1))},${
                            100 - value
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="currentColor"
                    className="text-primary"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {lineData.map((value, index) => (
                    <circle
                      key={index}
                      cx={index * (100 / (lineData.length - 1))}
                      cy={100 - value}
                      r="2"
                      className="fill-primary"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                  {lineData.map((_, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground"
                    >{`D${index + 1}`}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Pie Chart */}
            <div>
              <h3 className="text-md font-medium mb-2">Pie Chart</h3>
              <div className="flex items-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Simplified pie chart using individual paths instead of string concatenation */}
                    {(() => {
                      const total = pieData.reduce((sum, v) => sum + v, 0);
                      let currentAngle = 0;

                      return pieData.map((value, index) => {
                        const startAngle = currentAngle;
                        const angle = (value / total) * 360;
                        currentAngle += angle;

                        // Convert angles to radians and calculate points
                        const startRad = (startAngle - 90) * (Math.PI / 180);
                        const endRad = (currentAngle - 90) * (Math.PI / 180);

                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);

                        // Determine if the arc is more than 180 degrees
                        const largeArcFlag = angle > 180 ? 1 : 0;

                        // Set colors using inline styles
                        const colorStyles = {
                          fill: `var(--chart-${(index % 5) + 1})`,
                          stroke: "var(--background)",
                          strokeWidth: "1",
                        };

                        return (
                          <path
                            key={index}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            style={colorStyles}
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                <div className="ml-4 space-y-2">
                  {pieData.map((value, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-3 h-3 mr-2 rounded-sm"
                        style={{
                          backgroundColor: `var(--chart-${(index % 5) + 1})`,
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Form Elements */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Form Elements</h2>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full px-3 py-2 border border-input bg-background
                            rounded-md focus:outline-none focus:ring-2
                            focus:ring-primary/50"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label
                  htmlFor="select"
                  className="block text-sm font-medium mb-1"
                >
                  Select an Option
                </label>
                <select
                  id="select"
                  className="w-full px-3 py-2 border border-input bg-background
                            rounded-md focus:outline-none focus:ring-2
                            focus:ring-primary/50"
                >
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="checkbox"
                  type="checkbox"
                  className="w-4 h-4 border border-input 
                           rounded focus:ring-2 focus:ring-primary/50"
                />
                <label htmlFor="checkbox" className="text-sm">
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                           hover:bg-primary/90 transition-colors mr-2"
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md
                           hover:bg-secondary/90 transition-colors"
                >
                  Secondary Button
                </button>
              </div>
            </form>
          </section>

          {/* Table Section */}
          <section className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-muted/50 border-b border-border">
                    <td className="px-4 py-3 text-sm">Alice Smith</td>
                    <td className="px-4 py-3 text-sm">Admin</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">Bob Johnson</td>
                    <td className="px-4 py-3 text-sm">User</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center border-t border-border mt-8">
          <p className="text-sm text-muted-foreground">
            Dark/Light Mode Test Page © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
