import { toast } from "sonner";

export interface CloudinaryConfig {
    cloudName: string;
    uploadPreset: string;
}

export async function uploadToCloudinary(
    file: File | Blob,
    config?: CloudinaryConfig
): Promise<string | null> {
    // Config parametre olarak gelmezse env'den okumayı dene
    const cloudName = config?.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = config?.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === "buraya_cloud_name_gelecek") {
        // Detaylı loglama yapalım ki kullanıcı sorunu görsün
        console.error("Cloudinary Configuration Error:");
        console.error("- Cloud Name:", cloudName ? "Mevcut" : "EKSİK");
        console.error("- Upload Preset:", uploadPreset ? "Mevcut" : "EKSİK");
        toast.error("Cloudinary yapılandırması eksik. Konsolu kontrol edin.");
        return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "obs-web-studio/layers");

    // Dosya adından temiz bir public_id oluştur
    const fileName = file instanceof File ? file.name : "blob_image";
    const safeName = fileName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const publicId = `${safeName}_${Date.now()}`;
    formData.append("public_id", publicId);

    try {
        const resourceType = file.type.startsWith("video") ? "video" : "image";
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Yükleme başarısız");
        }

        const data = await response.json();
        return data.secure_url as string;
    } catch (error: any) {
        console.error("Cloudinary upload failure:", error);
        toast.error(`Yükleme hatası: ${error.message}`);
        return null;
    }
}
