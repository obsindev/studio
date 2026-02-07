import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_FILTERS, DEFAULT_PROJECT_CONFIG, Layer, ProjectConfig } from "@/types";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { getFilterStyle } from "@/lib/renderUtils";

import { expandConfig } from "@/lib/compression";

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
  const [error, setError] = useState<string | null>(null);

  // Helper to extract ID from URL (hash or query)
  const getProjectIdFromUrl = useCallback(() => {
    const hash = window.location.hash;
    const search = hash.includes("?") ? hash.split("?")[1] : window.location.search.substring(1);
    const params = new URLSearchParams(search);
    return params.get("id");
  }, []);

  // Redirect logic based on auth and URL params
  useEffect(() => {
    if (isAuthLoading) return;

    const id = getProjectIdFromUrl();

    // Only redirect to dashboard if NO ID is present (landing page behavior)
    if (!id) {
      // If main page without ID, go to dashboard/projects
      setLocation("/projects");
    }
  }, [user, isAuthLoading, setLocation, getProjectIdFromUrl]);

  const loadConfig = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const id = getProjectIdFromUrl();

      if (id) {
        // 1. Try fetching with is_public (newer schema)
        const { data: mainData, error: mainError } = await supabase
          .from("scenes")
          .select("config, is_public")
          .eq("id", id)
          .single();

        if (!mainError && mainData) {
          const expandedConfig = expandConfig(mainData.config);
          setConfig(normalizeProjectConfig(expandedConfig, mainData.is_public ?? undefined));
          setIsLoading(false);
          return;
        }

        // 2. Fallback: If error (any error, e.g. column missing, RLS), try selecting just config
        // This handles cases where 'is_public' column might not exist or be accessible
        const { data: legacyData, error: legacyError } = await supabase
          .from("scenes")
          .select("config")
          .eq("id", id)
          .single();

        if (legacyData) {
          // If we got data here, it means we can read the config. 
          // We assume it's public enough to read if RLS didn't block it.
          const expandedConfig = expandConfig(legacyData.config);
          setConfig(normalizeProjectConfig(expandedConfig, true));
          setIsLoading(false);
          return;
        }

        // 3. If both failed, show error
        console.error("Config load failed:", mainError, legacyError);
        setError("Proje bulunamadı veya erişim izniniz yok.");
        setIsLoading(false);
        return;
      }

      // Local dev / No ID handling
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const response = await fetch("/api/config");
        if (response.ok) {
          const serverConfig = await response.json();
          if (serverConfig) {
            setConfig(normalizeProjectConfig(serverConfig));
            setIsLoading(false);
            return;
          }
        }
      }

      // If no ID and not local dev, we are just on the landing page (which handled redirect in useEffect)
      // So we can stop loading.
      setIsLoading(false);

    } catch (error) {
      console.error("Critical load error:", error);
      setError("Beklenmeyen bir hata oluştu.");
      setIsLoading(false);
    }
  }, [getProjectIdFromUrl]);

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

  // Mobil için responsive scale hesapla
  const canvasScale = useMemo(() => {
    const { width: canvasW, height: canvasH } = config.canvasSize;
    const { width: windowW, height: windowH } = windowSize;

    if (windowW === 0 || windowH === 0) return 1;

    // Mobilde veya küçük ekranlarda canvas'ı viewport içine sığdır
    const padding = 20; // px
    const availableWidth = windowW - padding * 2;
    const availableHeight = windowH - padding * 2;

    const scaleX = availableWidth / canvasW;
    const scaleY = availableHeight / canvasH;

    // En küçük scale'i kullan (aspect ratio korunsun)
    const scale = Math.min(scaleX, scaleY, 1); // Max 1.0 (zoom yapmayalım)

    return scale;
  }, [config.canvasSize, windowSize]);

  const tilePositions = useMemo(() => {
    const { width: canvasW, height: canvasH } = config.canvasSize;
    const { width: windowW, height: windowH } = windowSize;

    if (windowW === 0 || windowH === 0) return [];

    const positions: { x: number; y: number; isMain: boolean }[] = [];

    // Scaled canvas dimensions
    const scaledW = canvasW * canvasScale;
    const scaledH = canvasH * canvasScale;

    const centerX = Math.floor(windowW / 2 - scaledW / 2);
    const centerY = Math.floor(windowH / 2 - scaledH / 2);

    const tilesLeft = Math.ceil(centerX / scaledW) + 1;
    const tilesRight = Math.ceil((windowW - centerX - scaledW) / scaledW) + 1;
    const tilesTop = Math.ceil(centerY / scaledH) + 1;
    const tilesBottom = Math.ceil((windowH - centerY - scaledH) / scaledH) + 1;

    for (let row = -tilesTop; row <= tilesBottom; row++) {
      for (let col = -tilesLeft; col <= tilesRight; col++) {
        const x = centerX + col * scaledW;
        const y = centerY + row * scaledH;

        if (x + scaledW > 0 && x < windowW && y + scaledH > 0 && y < windowH) {
          positions.push({
            x,
            y,
            isMain: col === 0 && row === 0,
          });
        }
      }
    }

    return positions;
  }, [config.canvasSize, windowSize, canvasScale]);

  const renderCanvas = (isMain: boolean) => (
    <div
      className="absolute overflow-hidden"
      style={{
        width: config.canvasSize.width,
        height: config.canvasSize.height,
        backgroundColor: config.backgroundColor,
        transform: `scale(${canvasScale})`,
        transformOrigin: 'top left',
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
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white pointer-events-auto">
          <div className="text-center p-6 border border-red-500/30 bg-red-950/20 rounded-lg backdrop-blur-md">
            <p className="text-lg font-bold text-red-500 mb-2">Hata</p>
            <p className="text-sm opacity-80">{error}</p>
            <div className="mt-4 text-xs text-gray-500">
              Login gerekmeden yayın görüntülemek için <a href="/#/projects" className="text-primary hover:underline">ana sayfaya</a> gidebilirsiniz.
            </div>
          </div>
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

