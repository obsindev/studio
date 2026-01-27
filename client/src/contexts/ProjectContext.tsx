import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  ProjectConfig,
  Layer,
  LayerFilters,
  CanvasSize,
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_FILTERS,
  createNewLayer,
  MediaType,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProjectContextType {
  // Proje durumu
  config: ProjectConfig;
  isLoading: boolean;

  // Katman işlemleri
  addLayer: (name: string, type: MediaType, source: string) => Promise<void>;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  updateLayerFilters: (layerId: string, filters: Partial<LayerFilters>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateLayer: (layerId: string) => void;

  // Seçili katman
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  selectedLayer: Layer | null;

  // Tuval işlemleri
  setCanvasSize: (size: CanvasSize) => void;
  setBackgroundColor: (color: string) => void;

  // Proje işlemleri
  setProjectName: (name: string) => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
  resetConfig: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (jsonString: string) => boolean;
  shareProject: () => Promise<string | null>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const selectedLayer = config.layers.find(l => l.id === selectedLayerId) || null;

  // URL'den proje ID'sini kontrol et
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setProjectId(id);
    }
  }, []);

  // İlk yüklemede buluttan veya yerel sunucudan config'i çek
  useEffect(() => {
    const loadInitialConfig = async () => {
      setIsLoading(true);
      try {
        // Eğer URL'de bir ID varsa önce buluttan çek
        if (projectId) {
          const { data, error } = await supabase
            .from('scenes')
            .select('config')
            .eq('id', projectId)
            .single();

          if (data && !error) {
            setConfig(data.config);
            setIsLoading(false);
            return;
          }
        }

        // Bulutta yoksa veya ID yoksa yerel API'yi dene (Fallback)
        const response = await fetch('/api/config');
        if (response.ok) {
          const serverConfig = await response.json();
          if (serverConfig) {
            const configWithDefaults = {
              ...serverConfig,
              layers: serverConfig.layers.map((layer: Layer) => ({
                ...layer,
                filters: { ...DEFAULT_FILTERS, ...layer.filters },
              })),
            };
            setConfig(configWithDefaults);
          }
        }
      } catch (error) {
        console.error('Config yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialConfig();
  }, [projectId]);

  // Otomatik kaydetme (Debounced)
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      // Yerel API'ye kaydet (Hala varsa)
      try {
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
      } catch (e) { }

      // Eğer bir bulut projesi içindeysek buluta da otomatik kaydet
      if (projectId) {
        await supabase
          .from('scenes')
          .update({ config, updated_at: new Date().toISOString() })
          .eq('id', projectId);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [config, isLoading, projectId]);

  // Resim yükleme ve Cloud Storage entegrasyonu
  const uploadToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `layers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addLayer = useCallback(async (name: string, type: MediaType, source: string) => {
    let finalSource = source;

    // Eğer source bir dataURL (Base64) ise ve dosya seçilmişse buluta yükle
    if (source.startsWith('data:')) {
      const response = await fetch(source);
      const blob = await response.blob();
      const file = new File([blob], name, { type: blob.type });

      const cloudUrl = await uploadToStorage(file);
      if (cloudUrl) {
        finalSource = cloudUrl;
      }
    }

    const maxZIndex = config.layers.length > 0
      ? Math.max(...config.layers.map(l => l.zIndex))
      : 0;

    const newLayer = createNewLayer(name, type, finalSource, maxZIndex + 1);

    setConfig(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      lastModified: new Date().toISOString(),
    }));

    setSelectedLayerId(newLayer.id);
  }, [config.layers]);

  const removeLayer = useCallback((layerId: string) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== layerId),
      lastModified: new Date().toISOString(),
    }));

    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId
          ? { ...l, ...updates, updatedAt: new Date().toISOString() }
          : l
      ),
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const updateLayerFilters = useCallback((layerId: string, filters: Partial<LayerFilters>) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId
          ? {
            ...l,
            filters: { ...l.filters, ...filters },
            updatedAt: new Date().toISOString()
          }
          : l
      ),
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const newLayers = [...prev.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);

      const reindexed = newLayers.map((layer, index) => ({
        ...layer,
        zIndex: index + 1,
      }));

      return {
        ...prev,
        layers: reindexed,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = config.layers.find(l => l.id === layerId);
    if (!layer) return;

    const maxZIndex = Math.max(...config.layers.map(l => l.zIndex));
    const newLayer = createNewLayer(
      `${layer.name} (Kopya)`,
      layer.type,
      layer.source,
      maxZIndex + 1
    );
    newLayer.filters = { ...layer.filters };

    setConfig(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      lastModified: new Date().toISOString(),
    }));

    setSelectedLayerId(newLayer.id);
  }, [config.layers]);

  const setCanvasSize = useCallback((size: CanvasSize) => {
    setConfig(prev => ({
      ...prev,
      canvasSize: size,
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    setConfig(prev => ({
      ...prev,
      backgroundColor: color,
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const setProjectName = useCallback((name: string) => {
    setConfig(prev => ({
      ...prev,
      name,
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const saveConfig = useCallback(async () => {
    if (projectId) {
      const { error } = await supabase
        .from('scenes')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) toast.error('Bulut kaydı başarısız oldu');
    }
  }, [config, projectId]);

  const loadConfig = useCallback(async () => {
    if (projectId) {
      const { data, error } = await supabase
        .from('scenes')
        .select('config')
        .eq('id', projectId)
        .single();

      if (data && !error) setConfig(data.config);
    }
  }, [projectId]);

  const resetConfig = useCallback(async () => {
    setConfig(DEFAULT_PROJECT_CONFIG);
    setSelectedLayerId(null);
    setProjectId(null);
  }, []);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.canvasSize && parsed.layers && Array.isArray(parsed.layers)) {
        setConfig({
          ...DEFAULT_PROJECT_CONFIG,
          ...parsed,
          lastModified: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const shareProject = async (): Promise<string | null> => {
    try {
      // Mevcut ID varsa güncelle, yoksa yeni oluştur
      if (projectId) {
        await saveConfig();
        return `${window.location.origin}${window.location.pathname}?id=${projectId}`;
      } else {
        const newId = Math.random().toString(36).substring(2, 10);
        const { error } = await supabase
          .from('scenes')
          .insert([{ id: newId, config, created_at: new Date().toISOString() }]);

        if (error) {
          console.error('Share error:', error);
          toast.error('Paylaşım linki oluşturulamadı');
          return null;
        }

        setProjectId(newId);
        window.history.pushState({}, '', `?id=${newId}`);
        return `${window.location.origin}${window.location.pathname}?id=${newId}`;
      }
    } catch (e) {
      return null;
    }
  };

  const value: ProjectContextType = {
    config,
    isLoading,
    addLayer,
    removeLayer,
    updateLayer,
    updateLayerFilters,
    reorderLayers,
    duplicateLayer,
    selectedLayerId,
    setSelectedLayerId,
    selectedLayer,
    setCanvasSize,
    setBackgroundColor,
    setProjectName,
    saveConfig,
    loadConfig,
    resetConfig,
    exportConfig,
    importConfig,
    shareProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
