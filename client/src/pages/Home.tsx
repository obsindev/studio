import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_FILTERS, DEFAULT_PROJECT_CONFIG, Layer, ProjectConfig } from "@/types";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { getFilterStyle } from "@/lib/renderUtils";

const isAccessColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message ?? "");
  return message.includes("is_public") || message.includes("user_id");
};

const normalizeProjectConfig = (
  raw: unknown,
  isPublicOverride?: boolean
): ProjectConfig => {
  const parsed = raw && typeof raw === "object" ? (raw as Partial<ProjectConfig>) : {};
  const layers = (Array.isArray(parsed.layers) ? parsed.layers : []).map((layer) => ({
    ...(layer as Layer),
    filters: { ...DEFAULT_FILTERS, ...((layer as Layer).filters ?? {}) },
  }));

  return {
    ...DEFAULT_PROJECT_CONFIG,
    ...parsed,
    isPublic:
      typeof isPublicOverride === "boolean"
        ? isPublicOverride
        : typeof parsed.isPublic === "boolean"
          ? parsed.isPublic
          : DEFAULT_PROJECT_CONFIG.isPublic,
    layers,
    lastModified: parsed.lastModified ?? new Date().toISOString(),
  };
};

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect logic based on auth and URL params
  useEffect(() => {
    if (isAuthLoading) return;

    const search = window.location.hash.includes("?")
      ? window.location.hash.split("?")[1]
      : window.location.search.substring(1);
    const params = new URLSearchParams(search);
    const id = params.get("id");

    // Only redirect if NO ID is present (landing page behavior)
    if (!id) {
      if (user) {
        setLocation("/projects");
      } else {
        setLocation("/login");
      }
    }
  }, [user, isAuthLoading, setLocation]);

  const loadConfig = useCallback(async () => {
    try {
      const search = window.location.hash.includes("?")
        ? window.location.hash.split("?")[1]
        : window.location.search.substring(1);
      const params = new URLSearchParams(search);
      const id = params.get("id");

      if (id) {
        let { data, error } = await supabase
          .from("scenes")
          .select("config, is_public")
          .eq("id", id)
          .single();

        if (error && isAccessColumnError(error)) {
          const legacyResult = await supabase
            .from("scenes")
            .select("config")
            .eq("id", id)
            .single();
          data = legacyResult.data ? { ...legacyResult.data, is_public: undefined } : null;
          error = legacyResult.error;
        }

        if (data && !error) {
          setConfig(normalizeProjectConfig(data.config, data.is_public ?? undefined));
          setIsLoading(false);
          return;
        }
      }

      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const response = await fetch("/api/config");
        if (response.ok) {
          const serverConfig = await response.json();
          if (serverConfig) {
            setConfig(normalizeProjectConfig(serverConfig));
          }
        }
      }
    } catch (error) {
      console.error("Config load failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const sortedLayers = useMemo(
    () => [...config.layers].sort((a, b) => a.zIndex - b.zIndex),
    [config.layers]
  );

  const tilePositions = useMemo(() => {
    const { width: canvasW, height: canvasH } = config.canvasSize;
    const { width: windowW, height: windowH } = windowSize;

    if (windowW === 0 || windowH === 0) return [];

    const positions: { x: number; y: number; isMain: boolean }[] = [];

    const centerX = Math.floor(windowW / 2 - canvasW / 2);
    const centerY = Math.floor(windowH / 2 - canvasH / 2);

    const tilesLeft = Math.ceil(centerX / canvasW) + 1;
    const tilesRight = Math.ceil((windowW - centerX - canvasW) / canvasW) + 1;
    const tilesTop = Math.ceil(centerY / canvasH) + 1;
    const tilesBottom = Math.ceil((windowH - centerY - canvasH) / canvasH) + 1;

    for (let row = -tilesTop; row <= tilesBottom; row++) {
      for (let col = -tilesLeft; col <= tilesRight; col++) {
        const x = centerX + col * canvasW;
        const y = centerY + row * canvasH;

        if (x + canvasW > 0 && x < windowW && y + canvasH > 0 && y < windowH) {
          positions.push({
            x,
            y,
            isMain: col === 0 && row === 0,
          });
        }
      }
    }

    return positions;
  }, [config.canvasSize, windowSize]);

  const renderCanvas = (isMain: boolean) => (
    <div
      className="absolute overflow-hidden"
      style={{
        width: config.canvasSize.width,
        height: config.canvasSize.height,
        backgroundColor: config.backgroundColor,
        boxShadow: isMain
          ? "0 0 0 2px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)"
          : "none",
        opacity: isMain ? 1 : 0.7,
      }}
    >
      {sortedLayers.map((layer) => {
        const activeFilters = layer.filters.activeFilters || [];
        const disabledFilters = layer.filters.disabledFilters || [];
        const isUVActive = activeFilters.includes("uvScroll") && !disabledFilters.includes("uvScroll");
        const isScrolling = isUVActive && (layer.filters.uvScrollX !== 0 || layer.filters.uvScrollY !== 0);

        const content =
          layer.type === "video" ? (
            <video
              src={layer.source}
              autoPlay
              loop
              muted
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img
              src={layer.source}
              alt={layer.name}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          );

        return (
          <div
            key={layer.id}
            className="absolute inset-0"
            style={{
              zIndex: layer.zIndex,
            }}
          >
            <div className="w-full h-full flex items-center justify-center" style={getFilterStyle(layer)}>
              {isScrolling ? (
                <InfiniteScroll speedX={layer.filters.uvScrollX} speedY={layer.filters.uvScrollY}>
                  {content}
                </InfiniteScroll>
              ) : (
                content
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "#000" }}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0">
            {tilePositions.map((pos, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                }}
              >
                {renderCanvas(pos.isMain)}
              </div>
            ))}
          </div>

          {config.layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white/30 px-6">
                <Layers className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm md:text-lg">Henuz katman eklenmemis</p>
                <p className="text-xs md:text-sm mt-2 opacity-60">Config sayfasindan katman ekleyin</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

