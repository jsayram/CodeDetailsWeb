import { NextResponse } from "next/server";
import { supabaseClient } from "@/services/supabase";

export async function GET() {
  try {
    console.log("Fetching projects from Supabase...");

    // Fetch projects with explicit logging
    const { data, error, count } = await supabaseClient
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
    console.error("Server Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}