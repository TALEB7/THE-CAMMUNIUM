"use client";
import React, { useRef, useState } from "react";

type Props = {
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
};

export default function FileUploadZone({ onChange, accept = "image/*,application/pdf", maxSizeMB = 5, label }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handle = (files: FileList | null) => {
    const f = files?.[0] || null;
    if (!f) return onChange(null);
    if (f.size > maxSizeMB * 1024 * 1024) return onChange(null);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    onChange(f);
  };

  return (
    <div className="border-dashed border-2 rounded p-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input ref={ref} type="file" accept={accept} onChange={(e) => handle(e.target.files)} />
      {preview && <img src={preview} alt="preview" className="mt-2 max-h-40" />}
    </div>
  );
}
