/**
 * ConfigActions Component
 * Cyberpunk Control Room - Yapılandırma İşlemleri
 * 
 * JSON dışa/içe aktarma, sıfırlama işlemleri
 */

import React, { useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, Upload, RotateCcw, MoreVertical, Save, FileJson } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigActions() {
  const { config, exportConfig, importConfig, resetConfig, saveConfig, shareProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.replace(/\s+/g, '_')}_config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Yapılandırma dışa aktarıldı');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importConfig(content);
      if (success) {
        toast.success('Yapılandırma içe aktarıldı');
      } else {
        toast.error('Geçersiz yapılandırma dosyası');
      }
    };
    reader.onerror = () => {
      toast.error('Dosya okunamadı');
    };
    reader.readAsText(file);

    // Input'u sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    saveConfig();
    toast.success('Yapılandırma kaydedildi');
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            <MoreVertical className="w-4 h-4 mr-2" />
            İşlemler
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-card border-primary/30 w-48"
        >
          <DropdownMenuItem
            onClick={async () => {
              const link = await shareProject();
              if (link) {
                navigator.clipboard.writeText(link);
                toast.success('Paylaşım linki kopyalandı!');
              }
            }}
            className="focus:bg-primary/20 cursor-pointer text-primary"
          >
            <Download className="w-4 h-4 mr-2 rotate-180" />
            Linki Paylaş
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/20" />

          <DropdownMenuItem
            onClick={handleSave}
            className="focus:bg-primary/20 cursor-pointer"
          >
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/20" />

          <DropdownMenuItem
            onClick={handleExport}
            className="focus:bg-primary/20 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON Dışa Aktar
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="focus:bg-primary/20 cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            JSON İçe Aktar
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/20" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="focus:bg-destructive/20 text-destructive cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Sıfırla
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent className="cyber-panel bg-card border-primary/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-primary">
                  Yapılandırmayı Sıfırla
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Bu işlem tüm katmanları ve ayarları silecek. Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-primary/30 hover:border-primary hover:bg-primary/10">
                  İptal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetConfig}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
