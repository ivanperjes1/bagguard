import { readdir } from "node:fs/promises";
import path from "node:path";
import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

const privateSegments = new Set(["admin", "api", "auth", "report", "scan"]);

async function collectPublicRoutes(directory: string, segments: string[] = []): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const routeSegments = segments.filter((segment) => !segment.startsWith("(") && !segment.startsWith("@"));
  const isPrivate = routeSegments.some((segment) => privateSegments.has(segment));
  const routes = !isPrivate && entries.some((entry) => entry.isFile() && entry.name === "page.tsx")
    ? [`/${routeSegments.join("/")}`.replace(/\/$/, "") || "/"]
    : [];

  const childRoutes = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("@") && !entry.name.startsWith("."))
      .map((entry) => collectPublicRoutes(path.join(directory, entry.name), [...segments, entry.name])),
  );

  return [...routes, ...childRoutes.flat()];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, routes] = await Promise.all([
    siteUrl(),
    collectPublicRoutes(path.join(process.cwd(), "src/app")),
  ]);

  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
