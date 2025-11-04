"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

const YouTubePlayer = ({ videoId, title = "Vídeo", className }: YouTubePlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className={cn(
        "relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          style={{ border: 0 }}
        />
      </div>
    </motion.div>
  );
};

export default YouTubePlayer;

