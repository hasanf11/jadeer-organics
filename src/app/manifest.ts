import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ja'deer Organics",
    short_name: "Ja'deer",
    description: "Organic food & natural living in Lebanon — cash on delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ea",
    theme_color: "#2f8f3a",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
