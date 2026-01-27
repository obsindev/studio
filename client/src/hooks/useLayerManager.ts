import { useCallback } from 'react';
import { Layer, LayerFilters, MediaType, createNewLayer, ProjectConfig } from '@/types';

export function useLayerManager(
    config: ProjectConfig,
    setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>,
    setSelectedLayerId: (id: string | null) => void
) {
    const addLayer = useCallback(async (name: string, type: MediaType, source: string, uploadFn?: (file: File) => Promise<string | null>) => {
        let finalSource = source;

        if (source.startsWith('data:') && uploadFn) {
            const response = await fetch(source);
            const blob = await response.blob();
            const file = new File([blob], name, { type: blob.type });

            const cloudUrl = await uploadFn(file);
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
    }, [config.layers, setConfig, setSelectedLayerId]);

    const removeLayer = useCallback((layerId: string) => {
        setConfig(prev => ({
            ...prev,
            layers: prev.layers.filter(l => l.id !== layerId),
            lastModified: new Date().toISOString(),
        }));
    }, [setConfig]);

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
    }, [setConfig]);

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
    }, [setConfig]);

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
    }, [setConfig]);

    const setLayers = useCallback((layers: Layer[]) => {
        setConfig(prev => ({
            ...prev,
            layers,
            lastModified: new Date().toISOString(),
        }));
    }, [setConfig]);

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
    }, [config.layers, setConfig, setSelectedLayerId]);

    return {
        addLayer,
        removeLayer,
        updateLayer,
        updateLayerFilters,
        reorderLayers,
        setLayers,
        duplicateLayer,
    };
}
