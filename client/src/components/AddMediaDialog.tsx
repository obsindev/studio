/**
 * AddMediaDialog Component
 * Cyberpunk Control Room - Medya Ekleme Dialogu
 * 
 * Resim, GIF ve Video ekleme desteği
 */

import React, { useState, useRef, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { MediaType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Image, Film, FileImage, Upload, Link, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AddMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMediaDialog({ open, onOpenChange }: AddMediaDialogProps) {
  const { addLayer } = useProject();
  const [layerName, setLayerName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setLayerName('');
    setMediaUrl('');
    setPreviewUrl(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const detectMediaType = (url: string): MediaType => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.gif')) return 'gif';
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov')) return 'video';
    return 'image';
  };

  const handleUrlChange = (url: string) => {
    setMediaUrl(url);
    if (url) {
      const detected = detectMediaType(url);
      setMediaType(detected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya türünü kontrol et
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';

    if (!isImage && !isVideo) {
      toast.error('Desteklenmeyen dosya türü. Lütfen resim, GIF veya video yükleyin.');
      return;
    }

    // Medya türünü belirle
    if (isGif) {
      setMediaType('gif');
    } else if (isVideo) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    // Dosyayı base64'e çevir
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setMediaUrl(result);
      setPreviewUrl(result);
      setIsLoading(false);

      // Dosya adını katman adı olarak öner
      if (!layerName) {
        setLayerName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      toast.error('Dosya okunamadı');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [layerName]);

  const handleAddLayer = () => {
    if (!mediaUrl) {
      toast.error('Lütfen bir medya kaynağı seçin');
      return;
    }

    const name = layerName || `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Katmanı`;
    addLayer(name, mediaType, mediaUrl);
    toast.success(`"${name}" katmanı eklendi`);
    handleClose();
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'gif': return <FileImage className="w-5 h-5" />;
      case 'video': return <Film className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="cyber-panel bg-card border-primary/30 max-w-lg max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="font-display text-primary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Medya Ekle
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Katmana eklenecek resim, GIF veya video seçin
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
          {/* Katman Adı */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Katman Adı
            </Label>
            <Input
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              className="bg-secondary border-primary/30 focus:border-primary"
              placeholder="Katman adı girin (opsiyonel)"
            />
          </div>

          {/* Medya Kaynağı Seçimi */}
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full bg-secondary">
              <TabsTrigger
                value="upload"
                className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Dosya Yükle
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Link className="w-4 h-4 mr-2" />
                URL Gir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div
                className="border-2 border-dashed border-primary/30 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-primary/50" />
                <p className="text-sm text-muted-foreground">
                  Dosya seçmek için tıklayın veya sürükleyin
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, GIF, MP4, WEBM desteklenir
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Medya URL
                </Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="bg-secondary border-primary/30 focus:border-primary font-mono text-sm"
                  placeholder="https://example.com/image.png"
                />
              </div>

              {/* Medya Türü Seçimi */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Medya Türü
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(['image', 'gif', 'video'] as MediaType[]).map((type) => (
                    <Button
                      key={type}
                      variant={mediaType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaType(type)}
                      className={mediaType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'border-primary/30 hover:border-primary hover:bg-primary/10'
                      }
                    >
                      {getMediaIcon(type)}
                      <span className="ml-2 capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Önizleme */}
          {previewUrl && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Önizleme
              </Label>
              <div className="relative bg-secondary rounded-lg overflow-hidden border border-primary/30 aspect-video flex items-center justify-center">
                {isLoading ? (
                  <div className="text-muted-foreground">Yükleniyor...</div>
                ) : mediaType === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Önizleme"
                    className="max-w-full max-h-full object-contain"
                    onError={() => {
                      setPreviewUrl(null);
                      toast.error('Görsel yüklenemedi');
                    }}
                  />
                )}

                {/* Medya Türü Etiketi */}
                <div className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded text-xs font-tech flex items-center gap-1">
                  {getMediaIcon(mediaType)}
                  <span className="uppercase">{mediaType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Uyarı */}
          {mediaUrl && mediaUrl.startsWith('data:') && (
            <div className="flex items-start gap-2 p-3 bg-accent/10 rounded border border-accent/30 text-sm">
              <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Dosya base64 olarak kaydedilecek. Büyük dosyalar performansı etkileyebilir.
              </p>
            </div>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex justify-end gap-2 p-4 md:p-6 border-t border-primary/20 bg-background/50 shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            İptal
          </Button>
          <Button
            onClick={handleAddLayer}
            disabled={!mediaUrl || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Katman Ekle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
