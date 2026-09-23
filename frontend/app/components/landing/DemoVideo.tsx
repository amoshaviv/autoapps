"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import { DEMO_VIDEO_ID } from "./video";


// Shows the thumbnail until clicked, then loads the privacy-enhanced YouTube
// player. Keeps the landing page fast and loads nothing from YouTube until then.
export default function DemoVideo() {
  const [playing, setPlaying] = React.useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "16 / 9",
        width: "100%",
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "#0f172a",
        boxShadow: "0 30px 80px -20px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.06)",
      }}
    >
      {playing ? (
        <Box
          component="iframe"
          src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
          title="AutoApps demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      ) : (
        <ButtonBase
          onClick={() => setPlaying(true)}
          aria-label="Play the AutoApps demo video"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <Box
            component="img"
            src={`https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/maxresdefault.jpg`}
            alt="AutoApps demo: building an app from a Google Sheet"
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.45) 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: { xs: 64, md: 84 },
              height: { xs: 64, md: 84 },
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.45)",
              transition: "transform 150ms ease",
              ".MuiButtonBase-root:hover &": { transform: "scale(1.08)" },
            }}
          >
            <PlayArrowRounded sx={{ fontSize: { xs: 40, md: 52 } }} />
          </Box>
        </ButtonBase>
      )}
    </Box>
  );
}
