import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ProjectConfig,
  Layer,
  LayerFilters,
  CanvasSize,
  DEFAULT_PROJECT_CONFIG,
  MediaType,
} from '@/types';
import { useLayerManager } from '@/hooks/useLayerManager';
import { useStorage } from '@/hooks/useStorage';

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
  setLayers: (layers: Layer[]) => void;
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

  const {
    uploadToStorage,
    saveConfig,
    loadConfig,
    shareProject
  } = useStorage(config, setConfig, projectId, setProjectId, setIsLoading);

  const {
    addLayer: originalAddLayer,
    removeLayer: originalRemoveLayer,
    updateLayer,
    updateLayerFilters,
    reorderLayers,
    setLayers,
    duplicateLayer
  } = useLayerManager(config, setConfig, setSelectedLayerId);

  // Wrappers/Augmentations
  const addLayer = (name: string, type: MediaType, source: string) =>
    originalAddLayer(name, type, source, uploadToStorage);

  const removeLayer = (layerId: string) => {
    originalRemoveLayer(layerId);
    if (selectedLayerId === layerId) setSelectedLayerId(null);
  };

  // URL'den proje ID'sini kontrol et
  useEffect(() => {
    const search = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.search.substring(1);
    const params = new URLSearchParams(search);
    const id = params.get('id');
    if (id) setProjectId(id);
  }, []);

  // İlk yüklemede config'i çek
  useEffect(() => {
    loadConfig();
  }, [projectId, loadConfig]);

  // Otomatik kaydetme (Debounced)
  useEffect(() => {
    if (isLoading) return;
    const timeoutId = setTimeout(async () => {
      await saveConfig();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [config, isLoading, saveConfig]);

  const setCanvasSize = (size: CanvasSize) => {
    setConfig(prev => ({ ...prev, canvasSize: size, lastModified: new Date().toISOString() }));
  };

  const setBackgroundColor = (color: string) => {
    setConfig(prev => ({ ...prev, backgroundColor: color, lastModified: new Date().toISOString() }));
  };

  const setProjectName = (name: string) => {
    setConfig(prev => ({ ...prev, name, lastModified: new Date().toISOString() }));
  };

  const resetConfig = async () => {
    setConfig(DEFAULT_PROJECT_CONFIG);
    setSelectedLayerId(null);
    setProjectId(null);
  };

  const exportConfig = () => JSON.stringify(config, null, 2);

  const importConfig = (jsonString: string): boolean => {
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
  };

  const value: ProjectContextType = {
    config,
    isLoading,
    addLayer,
    removeLayer,
    updateLayer,
    updateLayerFilters,
    reorderLayers,
    setLayers,
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
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
}
