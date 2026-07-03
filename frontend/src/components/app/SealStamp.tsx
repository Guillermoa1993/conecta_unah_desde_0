import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateSealCanvasDataUrl } from "@/lib/constancia-pdf";

interface SealStampProps {
  nombre: string;
  cargo: string;
  departamento: string;
  codigo_firma: string;
}

export function SealStamp({ nombre, cargo, departamento, codigo_firma }: SealStampProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = generateSealCanvasDataUrl(nombre, cargo, departamento, codigo_firma);
    setDataUrl(url);
  }, [nombre, cargo, departamento, codigo_firma]);

  if (!dataUrl) return null;

  return (
    <motion.img
      src={dataUrl}
      alt="Sello"
      initial={{ scale: 2.5, opacity: 0, filter: "blur(8px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: "easeIn" }}
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />
  );
}
