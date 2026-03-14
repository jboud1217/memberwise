"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { getAssetUploadUrl, listAssets, deleteAsset } from "@/actions/template";

export interface Asset {
  key: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
}

interface AssetContextValue {
  assets: Asset[];
  loaded: boolean;
  loading: boolean;
  uploading: boolean;
  loadAssets: () => Promise<void>;
  uploadFiles: (files: FileList) => Promise<Asset[]>;
  removeAsset: (filename: string) => Promise<void>;
}

const AssetContext = createContext<AssetContextValue | null>(null);

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const loadedRef = useRef(false);

  const loadAssets = useCallback(async () => {
    if (loadedRef.current && !loading) {
      // Already loaded once, just refresh
    }
    setLoading(true);
    try {
      const result = await listAssets();
      setAssets(result);
      setLoaded(true);
      loadedRef.current = true;
    } catch {
      setAssets([]);
      setLoaded(true);
      loadedRef.current = true;
    }
    setLoading(false);
  }, [loading]);

  const uploadFiles = useCallback(async (files: FileList): Promise<Asset[]> => {
    setUploading(true);
    const newAssets: Asset[] = [];

    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${timestamp}-${safeName}`;

      try {
        const { uploadUrl, publicUrl } = await getAssetUploadUrl(filename, file.type);
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        const asset: Asset = {
          key: filename,
          filename,
          url: publicUrl,
          size: file.size,
          lastModified: new Date().toISOString(),
        };
        newAssets.push(asset);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    if (newAssets.length > 0) {
      setAssets((prev) => [...newAssets, ...prev]);
    }
    setUploading(false);
    return newAssets;
  }, []);

  const removeAsset = useCallback(async (filename: string) => {
    try {
      await deleteAsset(filename);
      setAssets((prev) => prev.filter((a) => a.filename !== filename));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  return (
    <AssetContext.Provider value={{ assets, loaded, loading, uploading, loadAssets, uploadFiles, removeAsset }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used within AssetProvider");
  return ctx;
}
