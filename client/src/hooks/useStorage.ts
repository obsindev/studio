import { useCallback } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { convertToWebP, isGIF, isImage } from "@/lib/imageUtils";
import { minifyConfig, expandConfig } from "@/lib/compression";
import { DEFAULT_FILTERS, DEFAULT_PROJECT_CONFIG, Layer, ProjectConfig } from "@/types";

const STORAGE_KEY = "obs_web_studio_last_config";
const ID_KEY = "obs_web_studio_last_id";

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

  const parsedLayers = Array.isArray(parsed.layers) ? (parsed.layers as any[]) : [];
  const layers: Layer[] = parsedLayers.map((layer) => {
    const safeLayer = layer as Layer;
    return {
      ...safeLayer,
      filters: { ...DEFAULT_FILTERS, ...(safeLayer.filters ?? {}) },
    };
  });

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

export function useStorage(
  config: ProjectConfig,
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>,
  projectId: string | null,
  setProjectId: (id: string | null) => void,
  setIsLoading: (loading: boolean) => void
) {
  const saveConfig = useCallback(async () => {
    // LocalStorage için de minify edebiliriz ama debug kolaylığı için şimdilik tam tutalım
    // veya tutarlılık için minify edelim. ExpandConfig her ikisini de (minified/full) okuyabilir.
    // Karar: LocalStorage'ı da minify edelim, alan kazancı sağlar.
    const minified = minifyConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minified));

    if (projectId) localStorage.setItem(ID_KEY, projectId);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      console.warn("User not logged in, saving locally only");
      return;
    }

    // Prevent saving empty projects
    if (config.layers.length === 0) {
      return;
    }

    // Cloud için Minify
    // const configToSave = minifyConfig(config); // Zaten yukarıda yaptık 'minified'

    // New Project or Fork: Create new record
    if (!projectId) {
      const newId = nanoid(10);
      const now = new Date().toISOString();
      // config nesnesi içine lastModified ekleyelim
      const configWithDate = { ...config, lastModified: now };
      const minifiedToSave = minifyConfig(configWithDate);

      const { error } = await supabase.from("scenes").insert([
        {
          id: newId,
          user_id: userId,
          is_public: config.isPublic,
          config: minifiedToSave,
          created_at: now,
          updated_at: now,
        },
      ]);

      if (error) {
        console.error("Cloud create failed:", error);
        toast.error("Proje olusturulamadi");
        return;
      }

      setProjectId(newId);
      setConfig(configWithDate);
      localStorage.setItem(ID_KEY, newId);

      // Update URL without reload
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("id", newId);
      currentUrl.searchParams.delete("new"); // Remove 'new' param if exists
      window.history.replaceState({}, "", currentUrl.toString());

      toast.success("Yeni proje olusturuldu");
      return;
    }

    // Existing Project: Update
    const now = new Date().toISOString();

    // Config'i güncellemeden önce lastModified'i güncelle
    const configToSave = { ...config, lastModified: now };
    const minifiedToUpdate = minifyConfig(configToSave);

    let { error } = await supabase
      .from("scenes")
      .update({
        config: minifiedToUpdate,
        is_public: config.isPublic,
        updated_at: now,
      })
      .eq("id", projectId)
      .eq("user_id", userId); // Ensure ownership

    // Handle legacy schema or RLS errors if necessary
    if (error) {
      console.error("Cloud save failed:", error);
      toast.error("Kaydetme basarisiz. Yetkiniz olmayabilir.");
    }
    // NOT: setConfig burada ÇAĞRILMAMALI - kullanıcının değişikliklerini geri alır
  }, [config, projectId]);

  const loadConfig = useCallback(
    async (targetId?: string) => {
      // If targetId is explicitly false (e.g. from new project flow), reset
      if (targetId === "") {
        setProjectId(null);
        setConfig(DEFAULT_PROJECT_CONFIG);
        localStorage.removeItem(ID_KEY);
        setIsLoading(false);
        return;
      }

      const idToLoad = targetId || projectId || localStorage.getItem(ID_KEY);

      if (!idToLoad) {
        // No ID to load, just reset to default
        setProjectId(null);

        // LocalStorage'dan son config'i çekmeyi deneyelim (Session Restore)
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const expanded = expandConfig(parsed);
            setConfig(normalizeProjectConfig(expanded));
          } catch (e) {
            console.error("Local recover failed", e);
            setConfig(DEFAULT_PROJECT_CONFIG);
          }
        } else {
          setConfig(DEFAULT_PROJECT_CONFIG);
        }

        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;

        let { data, error } = await supabase
          .from("scenes")
          .select("config, is_public, user_id")
          .eq("id", idToLoad)
          .single();

        if (error && isAccessColumnError(error)) {
          // ... legacy fallback omitted
          console.error("Legacy schema not supported in this update");
        }

        if (data && !error) {
          // Gelen veri minified olabilir, expand et
          const expandedConfig = expandConfig(data.config);

          setConfig(normalizeProjectConfig(expandedConfig, data.is_public ?? undefined));

          // Check ownership
          if (currentUserId && data.user_id === currentUserId) {
            setProjectId(idToLoad);
            localStorage.setItem(ID_KEY, idToLoad);
          } else {
            // Fork mode: Load data but clear ID
            setProjectId(null);
            localStorage.removeItem(ID_KEY);
            toast.info("Bu proje salt okunur. Degisiklikler yeni bir proje olarak kaydedilecek.");
          }
          return;
        }

        // If load fails, default
        setConfig(DEFAULT_PROJECT_CONFIG);
        setProjectId(null);
      } catch (error) {
        console.error("Config yuklenemedi:", error);
        toast.error("Proje yuklenemedi");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, setConfig, setIsLoading, setProjectId]
  );

  const shareProject = async (isPublic: boolean): Promise<string | null> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (authError || !userId) {
        toast.error("Paylasim icin giris yapmalisiniz");
        return null;
      }

      const updatedConfig = normalizeProjectConfig(
        {
          ...config,
          isPublic,
          lastModified: new Date().toISOString(),
        },
        isPublic
      );

      const minifiedConfig = minifyConfig(updatedConfig);

      const legacyConfig = { ...(updatedConfig as any), ownerId: userId }; // Legacy support if needed, likely irrelevant for minified

      if (projectId) {
        const now = new Date().toISOString();
        let { error } = await supabase
          .from("scenes")
          .update({
            config: minifiedConfig,
            is_public: isPublic,
            updated_at: now,
          })
          .eq("id", projectId);

        if (error && isAccessColumnError(error)) {
          // Legacy fallback removed/simplified
        }

        if (error) {
          console.error("Share error:", error);
          toast.error("Paylasim linki guncellenemedi");
          return null;
        }

        setConfig(updatedConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minifiedConfig));
        localStorage.setItem(ID_KEY, projectId);

        return `${window.location.origin}${window.location.pathname}#/?id=${projectId}`;
      }

      const newId = nanoid(10);
      const now = new Date().toISOString();

      let { error } = await supabase.from("scenes").insert([
        {
          id: newId,
          user_id: userId,
          is_public: isPublic,
          config: minifiedConfig,
          created_at: now,
          updated_at: now,
        },
      ]);

      if (error) {
        console.error("Share error:", error);
        toast.error("Paylasim linki olusturulamadi");
        return null;
      }

      setProjectId(newId);
      setConfig(updatedConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minifiedConfig));
      localStorage.setItem(ID_KEY, newId);

      const currentUrl = new URL(window.location.href);
      currentUrl.hash = `/?id=${newId}`;
      window.location.href = currentUrl.toString();

      return `${window.location.origin}${window.location.pathname}#/?id=${newId}`;
    } catch (error) {
      console.error("Share exception:", error);
      toast.error("Bir hata olustu");
      return null;
    }
  };

  return {
    saveConfig,
    loadConfig,
    shareProject,
  };
}

