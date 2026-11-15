import type { MetadataRoute } from "next";

// Siden deles med lenke og skal ikke finnes i søk.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
