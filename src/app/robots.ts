import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/register", "/bagtracker"],
      disallow: ["/admin", "/api", "/auth", "/scan", "/report"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
