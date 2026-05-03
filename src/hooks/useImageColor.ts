import { useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";

export function useImageColor(imageUrl?: string) {
  const [color, setColor] = useState<string>("rgb(38, 38, 38)"); // default neutral-800

  useEffect(() => {
    if (!imageUrl) return;

    const fac = new FastAverageColor();
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const extractedColor = fac.getColor(img);
        // We only want relatively dark colors for the background, 
        // if it's too bright, we darken it a bit or just use the extracted color.
        // For now, let's use the extracted dark/light color.
        // Using rgba for better blending
        setColor(`rgba(${extractedColor.value[0]}, ${extractedColor.value[1]}, ${extractedColor.value[2]}, 1)`);
      } catch (e) {
        console.warn("Failed to extract image color (likely CORS):", e);
      }
    };

    img.onerror = () => {
      console.warn("Failed to load image for color extraction");
    };

    return () => {
      fac.destroy();
    };
  }, [imageUrl]);

  return color;
}
