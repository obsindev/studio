import React from 'react';
import { Layer, LayerFilters } from '@/types';

/**
 * Creates CSS filter and transform styles for a layer based on its filter settings.
 */
export const getFilterStyle = (layer: Layer): React.CSSProperties => {
    const { filters } = layer;
    const activeFilters = filters.activeFilters || [];
    const disabledFilters = filters.disabledFilters || [];

    if (!filters.visible) {
        return { display: 'none' };
    }

    // Filter helper function
    const isFilterActive = (id: string) => activeFilters.includes(id) && !disabledFilters.includes(id);

    const filterString = [
        `opacity(${filters.opacity / 100})`,
        isFilterActive('hueRotate') ? `hue-rotate(${filters.hueRotate}deg)` : '',
        isFilterActive('colorAdjust') ? `brightness(${filters.brightness / 100})` : '',
        isFilterActive('colorAdjust') ? `contrast(${filters.contrast / 100})` : '',
        isFilterActive('colorAdjust') ? `saturate(${filters.saturate / 100})` : '',
        (isFilterActive('blur') && filters.blur > 0) ? `blur(${filters.blur}px)` : '',
    ].filter(Boolean).join(' ');

    const transformString = [
        `translate(${filters.offsetX}px, ${filters.offsetY}px)`,
        `scale(${filters.scale})`,
        `rotate(${filters.rotation}deg)`,
        filters.flipX ? 'scaleX(-1)' : '',
        filters.flipY ? 'scaleY(-1)' : '',
    ].filter(Boolean).join(' ');

    return {
        filter: filterString,
        transform: transformString,
        transformOrigin: 'center center',
    };
};
