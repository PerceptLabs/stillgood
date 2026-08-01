import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://stillgood.fyi", changeFrequency: "monthly", priority: 1 },
    {
      url: "https://stillgood.fyi/methodology",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://stillgood.fyi/privacy",
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
