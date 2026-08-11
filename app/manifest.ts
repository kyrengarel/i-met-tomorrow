import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "I MET TOMORROW — Founder Edition",
    short_name: "I MET TOMORROW",
    description: "A personal introduction from The Tomorrow Club.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    orientation: "portrait"
  };
}
