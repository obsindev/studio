import React, { useMemo } from 'react';
import { ProjectConfig } from '@/types';
import { getFilterStyle } from '@/lib/renderUtils';

interface ProjectThumbnailProps {
    config: ProjectConfig;
    className?: string;
}

export function ProjectThumbnail({ config, className = '' }: ProjectThumbnailProps) {
    const { canvasSize, backgroundColor, layers } = config;

    // Render scaling to fit container
    // Assuming the container is 16:9 or similar, we want to contain the canvas
    const sortedLayers = useMemo(() =>
        [...layers].sort((a, b) => a.zIndex - b.zIndex),
        [layers]
    );

    return (
        <div
            className={`relative w-full h-full overflow-hidden bg-black/50 ${className}`}
            style={{ backgroundColor }}
        >
            {/* Canvas Logic - Simplified for Preview */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* We use a container with aspect ratio matching the canvas */}
                <div
                    className="relative w-full h-full"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        aspectRatio: `${canvasSize.width} / ${canvasSize.height}`
                    }}
                >
                    {/* Grid Overlay for aesthetic */}
                    <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

                    {sortedLayers.map((layer) => {
                        if (!layer.filters.visible) return null;

                        return (
                            <div
                                key={layer.id}
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ zIndex: layer.zIndex }}
                            >
                                <div
                                    className="relative w-full h-full flex items-center justify-center"
                                    style={getFilterStyle(layer)}
                                >
                                    {layer.type === 'video' ? (
                                        <video
                                            src={layer.source}
                                            muted
                                            playsInline
                                            className="max-w-full max-h-full object-contain"
                                        // No autoplay for thumbnails to save resources, or maybe poster only?
                                        // Let's try simple img tag for video poster if available, or just render video paused
                                        />
                                    ) : (
                                        <img
                                            src={layer.source}
                                            alt={layer.name}
                                            className="max-w-full max-h-full object-contain"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overlay info if needed */}
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/70 font-tech backdrop-blur-sm">
                {canvasSize.width}x{canvasSize.height}
            </div>
        </div>
    );
}
