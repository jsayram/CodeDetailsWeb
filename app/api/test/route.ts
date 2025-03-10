import { NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

export async function GET() {
  try {
    console.log("Fetching data from Supabase...");

    // Fetch data with explicit logging
    const { data, error, count } = await supabase
      .from("projects")
      .select("*", { count: "exact" }) // Fetch total count
      .limit(5);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Total Items in DB:", count); // Logs total rows in DB
    console.log("Supabase Data:", data);

    return NextResponse.json({ data, count });

  } catch (err: any) {
    console.error("Server Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

