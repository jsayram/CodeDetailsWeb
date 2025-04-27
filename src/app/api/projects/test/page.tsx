"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DebugJwt } from "@/components/debug/page";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { API_ROUTES } from "@/constants/api-routes";
import { Project } from "@/types/models/project";
import { toast } from "sonner";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";

// This test route is deprecated and not needed in production.
export const dynamic = 'error';
export default function DeprecatedProjectsTest() {
  return <div>This endpoint is deprecated. Remove or ignore in production.</div>;
}
