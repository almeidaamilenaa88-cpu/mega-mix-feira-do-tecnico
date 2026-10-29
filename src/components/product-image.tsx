"use client";
import { useState } from "react";
export default function ProductImage({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="image-fallback" role="img" aria-label={name}>
      {name}
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      loading="lazy"
      style={
        src.includes("images.unsplash.com")
          ? undefined
          : { objectFit: "contain", padding: 12, background: "#fff" }
      }
      onError={() => setFailed(true)}
    />
  );
}
