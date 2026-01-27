import { useCallback } from 'react';
import { ProjectConfig, DEFAULT_PROJECT_CONFIG, DEFAULT_FILTERS, Layer } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useStorage(
    config: ProjectConfig,
    setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>,
    projectId: string | null,
    setProjectId: (id: string | null) => void,
    setIsLoading: (loading: boolean) => void
) {
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

    const saveConfig = useCallback(async () => {
        if (projectId) {
            const { error } = await supabase
                .from('scenes')
                .update({ config, updated_at: new Date().toISOString() })
                .eq('id', projectId);

            if (error) toast.error('Bulut kaydı başarısız oldu');
        }

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
                await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config),
                });
            } catch (e) { }
        }
    }, [config, projectId]);

    const loadConfig = useCallback(async (targetId?: string) => {
        const idToLoad = targetId || projectId;
        setIsLoading(true);
        try {
            if (idToLoad) {
                const { data, error } = await supabase
                    .from('scenes')
                    .select('config')
                    .eq('id', idToLoad)
                    .single();

                if (data && !error) {
                    setConfig(data.config);
                    setIsLoading(false);
                    return;
                }
            }

            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
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
            }
        } catch (error) {
            console.error('Config yüklenemedi:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, setConfig, setIsLoading]);

    const shareProject = async (): Promise<string | null> => {
        try {
            if (projectId) {
                await saveConfig();
                return `${window.location.origin}${window.location.pathname}#/?id=${projectId}`;
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
                window.location.hash = `/?id=${newId}`;
                return `${window.location.origin}${window.location.pathname}#/?id=${newId}`;
            }
        } catch (e) {
            return null;
        }
    };

    return {
        uploadToStorage,
        saveConfig,
        loadConfig,
        shareProject
    };
}
