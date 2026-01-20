// OBS Web Studio Type Definitions
// Cyberpunk Control Room - Katmanlı Medya Yönetim Sistemi

/**
 * Medya türleri - Katmanlara atanabilecek içerik tipleri
 */
export type MediaType = 'image' | 'gif' | 'video';

/**
 * Filtre/Özellik türleri - OBS benzeri katman efektleri
 */
export interface LayerFilters {
  /** Opaklık (0-100) */
  opacity: number;
  /** X ekseni kaydırma (piksel) */
  offsetX: number;
  /** Y ekseni kaydırma (piksel) */
  offsetY: number;
  /** Ölçek (0.1-3.0) */
  scale: number;
  /** Döndürme (0-360 derece) */
  rotation: number;
  /** Renk tonu kaydırma (0-360) */
  hueRotate: number;
  /** Parlaklık (0-200) */
  brightness: number;
  /** Kontrast (0-200) */
  contrast: number;
  /** Doygunluk (0-200) */
  saturate: number;
  /** Bulanıklık (0-20 piksel) */
  blur: number;
  /** Yatay çevirme */
  flipX: boolean;
  /** Dikey çevirme */
  flipY: boolean;
  /** UV Kaydırma X Hızı */
  uvScrollX: number;
  /** UV Kaydırma Y Hızı */
  uvScrollY: number;
  /** Görünürlük */
  visible: boolean;
}

/**
 * Katman tanımı - Tek bir medya katmanı
 */
export interface Layer {
  /** Benzersiz katman kimliği */
  id: string;
  /** Katman adı (kullanıcı tarafından belirlenir) */
  name: string;
  /** Medya türü */
  type: MediaType;
  /** Medya kaynağı (URL veya base64) */
  source: string;
  /** Katman sırası (yüksek = üstte) */
  zIndex: number;
  /** Filtre/özellik ayarları */
  filters: LayerFilters;
  /** Oluşturulma tarihi */
  createdAt: string;
  /** Son güncelleme tarihi */
  updatedAt: string;
}

/**
 * Tuval boyutu ayarları
 */
export interface CanvasSize {
  /** Genişlik (piksel) */
  width: number;
  /** Yükseklik (piksel) */
  height: number;
}

/**
 * Proje yapılandırması - JSON olarak kaydedilecek ana veri yapısı
 */
export interface ProjectConfig {
  /** Proje adı */
  name: string;
  /** Proje versiyonu */
  version: string;
  /** Tuval boyutu */
  canvasSize: CanvasSize;
  /** Arka plan rengi */
  backgroundColor: string;
  /** Katman listesi */
  layers: Layer[];
  /** Son güncelleme tarihi */
  lastModified: string;
}

/**
 * Varsayılan filtre değerleri
 */
export const DEFAULT_FILTERS: LayerFilters = {
  opacity: 100,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  hueRotate: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  flipX: false,
  flipY: false,
  uvScrollX: 0,
  uvScrollY: 0,
  visible: true,
};

/**
 * Varsayılan tuval boyutu
 */
export const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1920,
  height: 1080,
};

/**
 * Varsayılan proje yapılandırması
 */
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  name: 'Yeni Proje',
  version: '1.0.0',
  canvasSize: DEFAULT_CANVAS_SIZE,
  backgroundColor: '#0a0a0f',
  layers: [],
  lastModified: new Date().toISOString(),
};

/**
 * Preset tuval boyutları
 */
export const CANVAS_PRESETS: { name: string; size: CanvasSize }[] = [
  { name: 'Full HD (1920x1080)', size: { width: 1920, height: 1080 } },
  { name: '4K UHD (3840x2160)', size: { width: 3840, height: 2160 } },
  { name: 'HD (1280x720)', size: { width: 1280, height: 720 } },
  { name: 'Square (1080x1080)', size: { width: 1080, height: 1080 } },
  { name: 'Portrait (1080x1920)', size: { width: 1080, height: 1920 } },
  { name: 'Twitch (1920x1080)', size: { width: 1920, height: 1080 } },
  { name: 'YouTube (1920x1080)', size: { width: 1920, height: 1080 } },
  { name: 'Instagram Story (1080x1920)', size: { width: 1080, height: 1920 } },
];

/**
 * Yeni katman oluşturma yardımcı fonksiyonu
 */
export function createNewLayer(
  name: string,
  type: MediaType,
  source: string,
  zIndex: number
): Layer {
  const now = new Date().toISOString();
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    source,
    zIndex,
    filters: { ...DEFAULT_FILTERS },
    createdAt: now,
    updatedAt: now,
  };
}
