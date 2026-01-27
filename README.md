# OBS Web Studio

**OBS benzeri katmanlı medya yönetim web uygulaması**

Cyberpunk Control Room temasıyla tasarlanmış, modern ve modüler bir yapıya sahip web tabanlı sahne düzenleyici.

## Özellikler

### Katman Sistemi
- **Sınırsız katman** ekleme desteği
- Katman **sıralama** (drag & drop veya butonlarla)
- Her katmana **görünürlük** kontrolü
- Katman **kopyalama** ve **silme**

### Medya Desteği
- **Resim** (PNG, JPG, WEBP, vb.)
- **GIF** (animasyonlu)
- **Video** (MP4, WEBM)
- URL veya dosya yükleme

### Filtre/Özellikler (OBS Benzeri)
- **Opaklık** (0-100%)
- **Konum** (X/Y offset)
- **Ölçek** (0.1x - 3x)
- **Döndürme** (0-360°)
- **Renk Tonu** (Hue rotate)
- **Parlaklık** (0-200%)
- **Kontrast** (0-200%)
- **Doygunluk** (0-200%)
- **Bulanıklık** (0-20px)
- **Yatay/Dikey Çevirme**

### Tuval Sistemi
- Özelleştirilebilir **tuval boyutu**
- Hazır **preset boyutlar** (Full HD, 4K, Square, vb.)
- Özel **arka plan rengi**
- Ana sayfada **tile rendering** (tuval dışı alan tekrarlanır)

### Veri Yönetimi
- Otomatik **cloud sync** (Supabase)
- **Benzersiz link** paylaşımı (Unique shareable links)
- Otomatik **bulut depolama** (Local dosyalar otomatik Supabase Storage'a yüklenir)
- **JSON dışa aktarma**
- **JSON içe aktarma**
- Yapılandırma **sıfırlama**

## Bulut Kurulumu (Supabase)

Bu projeyi GitHub Pages veya internet üzerinden paylaşmak için bir Supabase projesine ihtiyacınız vardır:

1. [Supabase](https://supabase.com/) üzerinden ücretsiz bir proje oluşturun.
2. **Database:** `scenes` adında bir tablo oluşturun:
   - `id`: text (Primary Key)
   - `config`: jsonb
   - `created_at`: timestamptz
   - `updated_at`: timestamptz
3. **Storage:** `assets` adında **public** bir bucket oluşturun.
4. **Environment:** `.env.example` dosyasını `.env` olarak kopyalayın ve Supabase bilgilerini girin:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [pnpm](https://pnpm.io/) (otomatik kurulur)

### Windows'ta Çalıştırma

1. Projeyi indirin veya klonlayın
2. `start.bat` dosyasına çift tıklayın
3. Administrator izni verin
4. Tarayıcıda açın:
   - **Ana Sayfa:** http://localhost:3000
   - **Config:** http://localhost:3000/config

### Manuel Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Development sunucusu
pnpm dev

# Production build
pnpm build

# Production sunucusu
pnpm start
```

## Kullanım

### Config Sayfası (/config)
1. **Katman Ekle** butonuna tıklayın
2. Dosya yükleyin veya URL girin
3. Sol panelden katmanı seçin
4. Sağ panelden filtreleri ayarlayın
5. Tuval ayarlarını düzenleyin
6. Değişiklikler otomatik kaydedilir

### Ana Sayfa (/)
- Config'de ayarlanan sahneyi görüntüler
- Tuval dışındaki alan tile edilerek gösterilir
- Sağ üst köşeden Config'e geçiş yapabilirsiniz
- Yenile butonu ile güncel yapılandırmayı yükler

## Dosya Yapısı

```
obs-web-studio/
├── client/
│   ├── public/
│   │   └── images/          # Statik görseller
│   └── src/
│       ├── components/      # UI bileşenleri
│       │   ├── AddMediaDialog.tsx
│       │   ├── CanvasPreview.tsx
│       │   ├── CanvasSettings.tsx
│       │   ├── ConfigActions.tsx
│       │   ├── FilterPanel.tsx
│       │   └── LayerList.tsx
│       ├── contexts/
│       │   └── ProjectContext.tsx
│       ├── pages/
│       │   ├── Config.tsx   # Yapılandırma sayfası
│       │   └── Home.tsx     # Ana görüntü sayfası
│       ├── types/
│       │   └── index.ts     # TypeScript tipleri
│       └── App.tsx
├── start.bat                # Windows başlatıcı (Admin)
├── stop.bat                 # Sunucu durdurma
├── build.bat                # Production build
└── README.md
```

## JSON Yapılandırma Formatı

```json
{
  "name": "Proje Adı",
  "version": "1.0.0",
  "canvasSize": {
    "width": 1920,
    "height": 1080
  },
  "backgroundColor": "#0a0a0f",
  "layers": [
    {
      "id": "layer_xxx",
      "name": "Katman 1",
      "type": "image",
      "source": "https://...",
      "zIndex": 1,
      "filters": {
        "opacity": 100,
        "offsetX": 0,
        "offsetY": 0,
        "scale": 1,
        "rotation": 0,
        "hueRotate": 0,
        "brightness": 100,
        "contrast": 100,
        "saturate": 100,
        "blur": 0,
        "flipX": false,
        "flipY": false,
        "visible": true
      }
    }
  ],
  "lastModified": "2024-01-01T00:00:00.000Z"
}
```

## Teknolojiler

- **React 19** - UI framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI bileşenleri
- **Vite** - Build tool
- **Wouter** - Routing

## Tasarım Teması

**Cyberpunk Control Room** - Karanlık arka plan üzerinde neon cyan vurgular, teknik grid yapıları ve futuristik kontrol paneli estetiği.

- **Ana Renk:** Neon Cyan (#00f0ff)
- **Aksan:** Neon Magenta (#ff00aa)
- **Arka Plan:** Derin Uzay Siyahı (#0a0a0f)
- **Font:** Orbitron (başlıklar), JetBrains Mono (body)

## Lisans

MIT License
