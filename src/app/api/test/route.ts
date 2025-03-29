import { NextResponse } from "next/server";
import { getAnonymousClient } from "@/services/supabase";

export async function GET() {
  try {
    console.log("Fetching projects from Supabase...");

    // Fetch projects with explicit logging
    const { data, error, count } = await getAnonymousClient()
      .from("projects")
      .select("*", { count: "exact" }) // Fetch total count
      .order("id", { ascending: true });
      
    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Total Projects in DB:", count); // Logs total rows in DB
    console.log("Projects Data:", data);

    return NextResponse.json({ data, count });

  } catch (err: any) {
     // Type-safe error handling
     const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
     console.error("Server Error:", errorMessage);
     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}