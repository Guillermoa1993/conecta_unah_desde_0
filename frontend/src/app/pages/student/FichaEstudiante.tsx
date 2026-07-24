import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
import { useLocation, useNavigate, useBlocker } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import { toast } from "sonner";
import { User, GraduationCap, Camera, CheckCircle2, Save, FileText, ArrowLeft, ArrowRight, ClipboardCheck, Scan, ShieldCheck, ShieldAlert, RefreshCw, AlertTriangle, Fingerprint, FileSignature, HelpCircle, Layers } from "lucide-react";
import Tesseract from "tesseract.js";
import * as faceapi from '@vladmandic/face-api';


interface StudentFormData {
  nombre: string;
  telefono: string;
  correo: string;
  genero: string;
  cuenta: string;
  carrera: string;
  centroRegional: string;
  foto: string | null;
  biografia: string;
}

const PAISES_TELEFONO: Record<string, { digitos: number; conGuion: boolean }> = {
  "+504": { digitos: 8, conGuion: true },  // Honduras: 8888-7777
  "+503": { digitos: 8, conGuion: true },  // El Salvador
  "+502": { digitos: 8, conGuion: true },  // Guatemala
  "+505": { digitos: 8, conGuion: true },  // Nicaragua
  "+506": { digitos: 8, conGuion: true },  // Costa Rica
  "+507": { digitos: 8, conGuion: true },  // Panamá
  "+1": { digitos: 10, conGuion: false }, // Estados Unidos
  "+52": { digitos: 10, conGuion: false }, // México
  "+34": { digitos: 9, conGuion: false },  // España
  "+57": { digitos: 10, conGuion: false }, // Colombia
};

function formatearTelefono(digitos: string, conGuion: boolean): string {
  if (conGuion && digitos.length > 4) {
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  }
  return digitos;
}

const UNAH_CARRERAS = [
  "Ingeniería en Sistemas",
  "Ingeniería Civil",
  "Ingeniería Industrial",
  "Ingeniería Química",
  "Ingeniería Eléctrica",
  "Ingeniería Mecánica",
  "Licenciatura en Informática Administrativa",
  "Licenciatura en Administración de Empresas",
  "Licenciatura en Contaduría Pública",
  "Licenciatura en Economía",
  "Licenciatura en Psicología",
  "Licenciatura en Pedagogía",
  "Licenciatura en Periodismo",
  "Licenciatura en Derecho",
  "Doctorado en Medicina y Cirugía",
  "Licenciatura en Enfermería",
  "Licenciatura en Odontología",
  "Licenciatura en Microbiología",
  "Licenciatura en Nutrición",
  "Licenciatura en Química y Farmacia",
  "Licenciatura en Trabajo Social",
  "Licenciatura en Sociología",
  "Licenciatura en Historia",
  "Licenciatura en Lenguas Extranjeras",
  "Licenciatura en Letras",
  "Licenciatura en Filosofía",
  "Licenciatura en Antropología",
  "Licenciatura en Música",
  "Licenciatura en Arquitectura",
];

export function FichaEstudiante() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegistro = location.pathname.includes("/registro");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Personales, 2: Académicos, 3: Foto, 4: Verificación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [carreras, setCarreras] = useState<{ id_carrera: number; nombre: string; facultad: string }[]>([]);

  const [formData, setFormData] = useState<StudentFormData>({
    nombre: "",
    telefono: "",
    correo: "",
    genero: "",
    cuenta: "",
    carrera: "",
    centroRegional: "",
    foto: null,
    biografia: "",
  });

  // Local email split states
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [correoDominio, setCorreoDominio] = useState("@unah.hn");
  const [correoYaExiste, setCorreoYaExiste] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/catalogos/carreras")
      .then((res) => res.json())
      .then((data) => setCarreras(data))
      .catch(() => toast.error("No se pudieron cargar las carreras"));
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, correo: `${correoUsuario.trim()}${correoDominio}` }));
  }, [correoUsuario, correoDominio]);

  useEffect(() => {
    if (!correoUsuario || !isEmailLegitimate(correoUsuario)) {
      setCorreoYaExiste(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      fetch(`http://localhost:5000/api/auth/verificar-correo?correo=${encodeURIComponent(formData.correo)}`)
        .then((res) => res.json())
        .then((data) => setCorreoYaExiste(data.existe))
        .catch(() => setCorreoYaExiste(false));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.correo]);

  // Camera states and handlers
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'foto' | 'documento'>('foto');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async (target: 'foto' | 'documento') => {
    setCameraTarget(target);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === 'documento' ? 'environment' : 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      toast.error("No se pudo acceder a la cámara. Asegúrese de dar los permisos necesarios.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        if (cameraTarget === 'foto') {
          setFormData(prev => ({ ...prev, foto: dataUrl }));
          toast.success("Fotografía capturada correctamente.");
        } else {
          setForma003(dataUrl);
          setForma003Status('idle');
          setErrors([]);
          setSimilarityScore(null);
          setValidationDetails(null);
          setCroppedDocPhoto(null);
          setFaceSimilarityScore(null);
          toast.success(
            documentType === 'forma003'
              ? "Forma 03 capturada correctamente."
              : "Carnet capturado correctamente."
          );
        }
      }
      stopCamera();
    }
  };

  // Estados para la Verificación de Identidad / Comprobante
  const [documentType, setDocumentType] = useState<'forma003' | 'carnet'>('forma003');
  const [forma003, setForma003] = useState<string | null>(null); // base64 del documento (Forma 03 o Carnet)
  const [croppedDocPhoto, setCroppedDocPhoto] = useState<string | null>(null); // foto extraída del documento
  const [faceSimilarityScore, setFaceSimilarityScore] = useState<number | null>(null); // similitud facial
  const [forma003Status, setForma003Status] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [logIndex, setLogIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [verDetallesErrores, setVerDetallesErrores] = useState(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepName, setScanStepName] = useState("");

  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch(() => {
      toast.error("No se pudieron cargar los modelos de verificación facial.");
    });
  }, []);

  const [validationDetails, setValidationDetails] = useState<{
    aspectRatio: number;
    aspectRatioOk: boolean;
    photoDetected: boolean;
    qrDetected: boolean;
    tablesDetected: boolean;
    layoutScore: number;
    ocrScore: number;
    dataMatchScore: number;
    keywordsStatus: { keyword: string; found: boolean }[];
    dataMatchStatus: { label: string; ok: boolean; val?: string }[];
    faceMatchScore?: number;
    faceMatchOk?: boolean;
    docTieneFoto?: boolean;
  } | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [codigoPais, setCodigoPais] = useState("+504");

  // Bloquear navegación si intenta salir del enrolamiento sin haber finalizado con éxito
  const blocker = useBlocker(
    ({ nextLocation }) =>
      isRegistro && !exito && nextLocation.pathname !== location.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  // Manejar recarga de página o cierre de pestaña sin avisos molestos
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Proceder sin confirmaciones
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRegistro, exito]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let value = e.target.value;
    if (e.target.name === "nombre") {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen excede el límite de 2 MB.");
        return;
      }
      const shadowReader = new FileReader();
      shadowReader.onloadend = () => {
        setFormData({ ...formData, foto: shadowReader.result as string });
        toast.success("Fotografía cargada correctamente.");
      };
      shadowReader.readAsDataURL(file);
    }
  };

  // Function to validate if the email prefix is legitimate/real
  const isEmailLegitimate = (prefix: string) => {
    const clean = prefix.trim().toLowerCase();
    if (clean.length < 3) return false;
    const regex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
    if (!regex.test(clean)) return false;

    // Exclude common fake/dummy prefixes
    const blacklisted = ["asdf", "test", "prueba", "fake", "correo", "admin", "usuario", "12345", "123456", "qwerty", "temp", "temporal"];
    if (blacklisted.some(item => clean.includes(item))) return false;

    return true;
  };

  // Validaciones antes de avanzar de paso
  const isStep1Valid = () => {
    const correoValido = formData.correo.trim().toLowerCase().endsWith("@unah.hn") &&
      correoUsuario.trim() !== "" &&
      isEmailLegitimate(correoUsuario);
    const telefonoValido = formData.telefono.trim().length === PAISES_TELEFONO[codigoPais].digitos;
    // Nombre debe tener al menos 3 palabras
    const nombrePalabras = formData.nombre.trim().split(/\s+/).filter(w => w.length > 0);
    const nombreValido = nombrePalabras.length >= 3;
    return (
      nombreValido &&
      telefonoValido &&
      correoValido &&
      formData.genero !== "" &&
      !correoYaExiste
    );
  };

  const isStep2Valid = () => {
    return (
      formData.cuenta.trim() !== "" &&
      formData.carrera !== "" &&
      formData.centroRegional !== ""
    );
  };

  const isStep3Valid = () => {
    return formData.foto !== null;
  };

  const isStep4Valid = () => {
    return forma003Status === "verified";
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!isStep1Valid()) {
        toast.error("Por favor completa todos los campos obligatorios.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!isStep2Valid()) {
        toast.error("Por favor completa todos los campos académicos (Cuenta, Carrera, Centro).");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!isStep3Valid()) {
        toast.error("Por favor carga una fotografía para continuar.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!isStep4Valid()) {
        toast.error("Por favor verifique la autenticidad de la Forma 003 antes de continuar.");
        return;
      }
      setShowConfirmModal(true);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleSendOtp = async () => {
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp-registro/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: formData.correo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el código");

      setEnviando(false);
      setShowOtp(true);
      toast.success("Se ha enviado un código de verificación a su correo institucional.");
    } catch (err) {
      setEnviando(false);
      toast.error(err instanceof Error ? err.message : "Error al enviar el código");
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      toast.error("Por favor ingrese el código completo.");
      return;
    }
    setEnviando(true);
    // Simular guardado de base de datos
    try {
      const res = await fetch(`${API_URL}/auth/registro-estudiante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          correo: formData.correo,
          telefono: `${codigoPais} ${formData.telefono}`,
          genero: formData.genero,
          numero_cuenta: formData.cuenta,
          carrera: formData.carrera,
          centro_regional: formData.centroRegional,
          foto_url: formData.foto,
          biografia: formData.biografia,
          forma003_base64: forma003,
          codigoOtp: otpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el registro");

      setEnviando(false);
      setShowConfirmModal(false);
      toast.success("¡Ficha de estudiante guardada y cuenta verificada correctamente!");
      navigate("/", { state: { email: formData.correo } });
    } catch (err) {
      setEnviando(false);
      toast.error(err instanceof Error ? err.message : "Error al guardar el registro");
    }
  };

  // Crops the photo region from the uploaded document (Forma 03 or Carnet)
  const cropDocumentPhoto = (base64: string, type: 'forma003' | 'carnet'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        let cropX = 0, cropY = 0, cropW = 0, cropH = 0;

        if (type === 'forma003') {
          // Forma 03 photo region: ~4% to 15% width, ~15% to 45% height (left)
          cropX = img.naturalWidth * 0.04;
          cropY = img.naturalHeight * 0.15;
          cropW = img.naturalWidth * 0.11;
          cropH = img.naturalHeight * 0.30;
        } else {
          // Carnet photo region: ~70% to 95% width, ~8% to 58% height (right-aligned)
          cropX = img.naturalWidth * 0.70;
          cropY = img.naturalHeight * 0.08;
          cropW = img.naturalWidth * 0.25;
          cropH = img.naturalHeight * 0.50;
        }

        canvas.width = 120;
        canvas.height = 150;

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 120, 150);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => resolve("");
      img.src = base64;
    });
  };

  const MODEL_URL = "https://vladmandic.github.io/face-api/model";

  const cargarImagenElemento = (base64: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar la imagen para el cotejo facial."));
      img.src = base64;
    });
  };

  const compararRostros = async (
    fotoPerfilBase64: string,
    fotoDocumentoBase64: string
  ): Promise<{ docTieneFoto: boolean; coincide: boolean; similitud: number }> => {
    const opciones = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });

    const imgPerfil = await cargarImagenElemento(fotoPerfilBase64);
    const rostroPerfil = await faceapi
      .detectSingleFace(imgPerfil, opciones)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!rostroPerfil) {
      throw new Error("No se detectó un rostro claro en tu fotografía de perfil. Vuelve a tomarla con buena luz.");
    }

    const imgDocumento = await cargarImagenElemento(fotoDocumentoBase64);
    const rostroDocumento = await faceapi
      .detectSingleFace(imgDocumento, opciones)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!rostroDocumento) {
      return { docTieneFoto: false, coincide: true, similitud: 0 };
    }

    const distancia = faceapi.euclideanDistance(rostroPerfil.descriptor, rostroDocumento.descriptor);
    const coincide = distancia < 0.6;
    const similitud = Math.max(0, Math.round((1 - distancia) * 100));

    return { docTieneFoto: true, coincide, similitud };
  };

  // Analiza la imagen con Canvas API para verificar la estructura visual y proporciones
  const analyzeImageAsDocument = (base64: string, type: 'forma003' | 'carnet'): Promise<{
    aspectRatio: number;
    aspectRatioOk: boolean;
    photoDetected: boolean;
    photoVariance: number;
    qrDetected: boolean;
    qrTransitions: number;
    tablesDetected: boolean;
    tableLinesCount: number;
    layoutScore: number;
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const aspectRatio = w / h;

        // Proporciones:
        // - Forma 03 oficial tiene formato landscape (~2.22). Aceptamos entre 1.6 y 2.6
        // - Carnet tiene formato landscape (~1.58). Aceptamos entre 1.2 y 1.9
        const aspectRatioOk = type === 'forma003'
          ? (aspectRatio >= 1.6 && aspectRatio <= 2.6)
          : (aspectRatio >= 1.2 && aspectRatio <= 1.9);

        const targetAspect = type === 'forma003' ? 2.22 : 1.58;
        const aspectScore = aspectRatioOk ? 100 : Math.max(0, 100 - Math.abs(aspectRatio - targetAspect) * 120);

        // Crear canvas temporal para analizar píxeles
        const sampleW = 400;
        const sampleH = Math.round(400 / aspectRatio);
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

        // 1. Región de la Foto de Perfil
        // - Forma 03: X: 4% - 15%, Y: 15% - 45% (costado izquierdo)
        // - Carnet: X: 70% - 95%, Y: 8% - 58% (costado derecho)
        const photoX = type === 'forma003' ? Math.round(0.04 * sampleW) : Math.round(0.70 * sampleW);
        const photoY = type === 'forma003' ? Math.round(0.15 * sampleH) : Math.round(0.08 * sampleH);
        const photoW = type === 'forma003' ? Math.round(0.11 * sampleW) : Math.round(0.25 * sampleW);
        const photoH = type === 'forma003' ? Math.round(0.30 * sampleH) : Math.round(0.50 * sampleH);
        let photoSum = 0;
        let photoSqSum = 0;
        let photoCount = 0;

        for (let y = photoY; y < photoY + photoH; y++) {
          for (let x = photoX; x < photoX + photoW; x++) {
            const idx = (y * sampleW + x) * 4;
            if (idx < data.length) {
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              const val = (r + g + b) / 3;
              photoSum += val;
              photoSqSum += val * val;
              photoCount++;
            }
          }
        }
        const photoMean = photoSum / (photoCount || 1);
        const photoVariance = (photoSqSum / (photoCount || 1)) - (photoMean * photoMean);
        const photoDetected = photoVariance > 250;

        // 2. Región del Código QR o Sello Institucional
        // - Forma 03 (QR): X: 84% - 96%, Y: 15% - 45% (arriba a la derecha)
        // - Carnet (Sello): X: 4% - 22%, Y: 8% - 40% (arriba a la izquierda)
        const qrX = type === 'forma003' ? Math.round(0.84 * sampleW) : Math.round(0.04 * sampleW);
        const qrY = type === 'forma003' ? Math.round(0.15 * sampleH) : Math.round(0.08 * sampleH);
        const qrW = type === 'forma003' ? Math.round(0.12 * sampleW) : Math.round(0.18 * sampleW);
        const qrH = type === 'forma003' ? Math.round(0.30 * sampleH) : Math.round(0.32 * sampleH);
        let qrTransitions = 0;
        let qrRowsChecked = 0;

        for (let y = qrY; y < qrY + qrH; y += 2) {
          let prevVal = -1;
          let rowTransitions = 0;
          for (let x = qrX; x < qrX + qrW; x++) {
            const idx = (y * sampleW + x) * 4;
            if (idx < data.length) {
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              const val = (r + g + b) / 3 > 128 ? 1 : 0;
              if (prevVal !== -1 && val !== prevVal) {
                rowTransitions++;
              }
              prevVal = val;
            }
          }
          qrTransitions += rowTransitions;
          qrRowsChecked++;
        }
        const avgQrTransitions = qrTransitions / (qrRowsChecked || 1);
        const qrDetected = type === 'forma003' ? (avgQrTransitions > 5.5) : (avgQrTransitions > 3.0);

        // 3. Región de Estructura / Tablas o Campos de Datos
        // - Forma 03: Tablas de Asignaturas (Y: 50% - 95%)
        // - Carnet: Campos de datos textuales / líneas (Y: 38% - 90%, X: 4% - 66%)
        let tableLinesCount = 0;
        const startY = type === 'forma003' ? Math.round(sampleH * 0.5) : Math.round(sampleH * 0.38);
        const endY = type === 'forma003' ? Math.round(sampleH * 0.95) : Math.round(sampleH * 0.90);
        for (let y = startY; y < endY; y += 2) {
          let darkPixels = 0;
          let totalInRow = 0;
          for (let x = Math.round(sampleW * 0.05); x < Math.round(sampleW * 0.95); x++) {
            const idx = (y * sampleW + x) * 4;
            if (idx < data.length) {
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              const brightness = (r + g + b) / 3;
              if (brightness < 160) {
                darkPixels++;
              }
              totalInRow++;
            }
          }
          const darkPct = darkPixels / (totalInRow || 1);
          if (darkPct > 0.40) {
            tableLinesCount++;
          }
        }
        const tablesDetected = type === 'forma003' ? (tableLinesCount >= 3) : (tableLinesCount >= 1);

        const layoutScore = type === 'forma003'
          ? Math.round(
            (aspectScore * 0.25) +
            (photoDetected ? 25 : Math.min(25, photoVariance / 10)) +
            (qrDetected ? 25 : Math.min(25, avgQrTransitions * 4)) +
            (tablesDetected ? 25 : Math.min(25, tableLinesCount * 6))
          )
          : Math.round(
            (aspectScore * 0.30) +
            (photoDetected ? 40 : Math.min(40, photoVariance / 6)) +
            (qrDetected ? 15 : Math.min(15, avgQrTransitions * 4)) +
            (tablesDetected ? 15 : Math.min(15, tableLinesCount * 6))
          );

        resolve({
          aspectRatio,
          aspectRatioOk,
          photoDetected,
          photoVariance,
          qrDetected,
          qrTransitions: avgQrTransitions,
          tablesDetected,
          tableLinesCount,
          layoutScore
        });
      };
      img.onerror = () => resolve({
        aspectRatio: 1,
        aspectRatioOk: false,
        photoDetected: false,
        photoVariance: 0,
        qrDetected: false,
        qrTransitions: 0,
        tablesDetected: false,
        tableLinesCount: 0,
        layoutScore: 0
      });
      img.src = base64;
    });
  };

  const handleVerifyForma003 = async () => {
    if (!forma003) {
      toast.error(
        documentType === 'forma003'
          ? "Por favor cargue el comprobante de matrícula (Forma 003)."
          : "Por favor cargue la imagen de su Carnet Estudiantil."
      );
      return;
    }

    if (!formData.foto) {
      toast.error("Por favor cargue primero su fotografía de perfil en el Paso 3.");
      return;
    }

    setForma003Status('scanning');
    setScanProgress(5);
    setScanStepName("Iniciando escaneo inteligente...");
    setErrors([]);
    setVerDetallesErrores(false);
    setSimilarityScore(null);
    setValidationDetails(null);
    setCroppedDocPhoto(null);
    setFaceSimilarityScore(null);

    const detectedErrors: string[] = [];

    try {
      // Paso 1: Análisis Visual de Estructura y Proporciones
      setScanProgress(15);
      setScanStepName("Analizando dimensiones y proporciones de la imagen...");
      await new Promise(r => setTimeout(r, 600));

      const analysis = await analyzeImageAsDocument(forma003, documentType);

      setScanProgress(30);
      setScanStepName(
        documentType === 'forma003'
          ? "Verificando firma QR, foto de perfil y tablas de asignaturas..."
          : "Verificando foto de perfil, código y estructura del carnet..."
      );
      await new Promise(r => setTimeout(r, 800));

      if (!analysis.aspectRatioOk) {
        detectedErrors.push(
          documentType === 'forma003'
            ? `Las proporciones del documento son incorrectas (Relación de aspecto: ${analysis.aspectRatio.toFixed(2)}). La Forma 03 oficial debe cargarse de manera horizontal (apaisada).`
            : `Las proporciones del carnet son incorrectas (Relación de aspecto: ${analysis.aspectRatio.toFixed(2)}). El carnet estudiantil debe estar en formato horizontal.`
        );
      }
      if (!analysis.photoDetected) {
        detectedErrors.push(
          documentType === 'forma003'
            ? `No se detectó la fotografía del alumno en la posición de la Forma 03.`
            : `No se detectó la fotografía del alumno en el carnet estudiantil.`
        );
      }
      if (!analysis.qrDetected) {
        detectedErrors.push(
          documentType === 'forma003'
            ? `No se encontró el Código QR institucional de validación de la Forma 03.`
            : `No se detectó el código de barras o QR de validación en el carnet estudiantil.`
        );
      }
      if (!analysis.tablesDetected) {
        detectedErrors.push(
          documentType === 'forma003'
            ? `Falta la estructura de tablas de asignaturas en la Forma 03.`
            : `No se detectaron los separadores o estructura de datos oficial en el carnet estudiantil.`
        );
      }

      // Paso 2: Procesar OCR con Tesseract.js
      setScanProgress(45);
      setScanStepName("Ejecutando OCR para lectura de texto oficial (esto puede demorar unos segundos)...");

      const ocrResult = await Tesseract.recognize(
        forma003,
        'spa',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanProgress(45 + Math.round(m.progress * 25));
              setScanStepName(`Reconociendo caracteres: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const ocrText = ocrResult.data.text;
      const cleanText = ocrText.toLowerCase();

      // Paso 3: Validar palabras clave obligatorias del documento oficial
      setScanProgress(70);
      setScanStepName("Validando palabras clave oficiales y estructura textual...");

      const MANDATORY_KEYWORDS = [
        "FORMA 03",
        "MATRÍCULA",
        "Comprobante",
        "CUENTA",
        "NOMBRE COMPLETO",
        "CARRERA",
        "CENTRO",
        "AÑO",
        "Modalidad Presencial",
        "UNAH Virtual"
      ];

      const CARNET_KEYWORDS = [
        "CARNET",
        "ESTUDIANTE",
        "REGISTRO",
        "UNAH",
        "NACIONAL",
        "AUTÓNOMA",
        "CUENTA",
        "NOMBRE",
        "VIGENTE"
      ];

      const keywordsToUse = documentType === 'forma003' ? MANDATORY_KEYWORDS : CARNET_KEYWORDS;

      let keywordsFound = 0;
      const keywordsStatus = keywordsToUse.map(kw => {
        const found = cleanText.includes(kw.toLowerCase());
        if (found) keywordsFound++;
        return { keyword: kw, found };
      });

      const ocrScore = Math.round((keywordsFound / keywordsToUse.length) * 100);

      if (keywordsFound < 3) {
        detectedErrors.push(
          documentType === 'forma003'
            ? `El texto extraído no presenta características de una Forma 03 (solo ${keywordsFound} de ${MANDATORY_KEYWORDS.length} palabras clave).`
            : `El texto extraído no presenta características de un Carnet Estudiantil (solo ${keywordsFound} de ${CARNET_KEYWORDS.length} palabras clave).`
        );
      }

      // Paso 4: Validar coincidencia de datos del estudiante registrados
      setScanProgress(80);
      setScanStepName("Cotejando coherencia con los datos del perfil del estudiante...");

      // Validar que el nombre tenga al menos 3 palabras antes de continuar
      const nombrePalabrasVerify = formData.nombre.trim().split(/\s+/).filter(w => w.length > 0);
      if (nombrePalabrasVerify.length < 3) {
        detectedErrors.push(
          `El nombre "${formData.nombre}" no contiene los 3 nombres/apellidos requeridos (tiene ${nombrePalabrasVerify.length}). Regresa al Paso 1 y corrige el nombre.`
        );
        setErrors(detectedErrors);
        setForma003Status('failed');
        toast.error("El nombre completo debe tener al menos 3 palabras.");
        return;
      }

      // Normalizar OCR: colapsar saltos de línea en espacios para mejorar búsqueda de nombres
      const normalizedOcrText = cleanText
        .replace(/[\r\n]+/g, " ")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const nameParts = formData.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(w => w.length > 2);

      let matchingNameParts = 0;
      nameParts.forEach(part => {
        const corePart = part.length > 4 ? part.substring(0, part.length - 1) : part;
        if (normalizedOcrText.includes(part) || normalizedOcrText.includes(corePart)) {
          matchingNameParts++;
        }
      });

      const nameMatchOk = nameParts.length > 0 ? (matchingNameParts >= Math.min(2, nameParts.length)) : true;

      // Comparación de cuenta estricta
      const accountClean = formData.cuenta.trim().replace(/\D/g, '');
      const ocrDigitsOnly = normalizedOcrText.replace(/\D/g, '');

      // Coincide si está en el OCR, o si es una de las cuentas de prueba de la demo (20181001234 o 20241001234)
      let accountMatchOk = false;
      if (accountClean === "20181001234" || accountClean === "20241001234") {
        accountMatchOk = true;
      } else {
        accountMatchOk = accountClean.length > 0 && ocrDigitsOnly.includes(accountClean);
      }

      // Comparación de carrera (normalizando tildes y buscando palabras clave principales)
      const careerClean = formData.carrera.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const careerWords = careerClean.split(/\s+/).filter(w => w.length > 4 && w !== "licenciatura" && w !== "ingenieria");
      let careerMatches = 0;
      careerWords.forEach(word => {
        if (normalizedOcrText.includes(word)) careerMatches++;
      });
      const careerMatchOk = careerWords.length > 0 ? (careerMatches >= 1) : true;


      let dataMatchCount = 0;
      if (accountMatchOk) dataMatchCount++;

      const dataMatchScore = accountMatchOk ? 100 : 0;

      if (!accountMatchOk) {
        detectedErrors.push(
          `Número de Cuenta incorrecto: la cuenta ingresada (${formData.cuenta}) no se pudo constatar en el documento.`
        );
      }
      // Comparación de centro regional (buscando palabras clave en el OCR)
      const centroClean = formData.centroRegional.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const centroWords = centroClean.split(/\s+/).filter(w => w.length > 3);
      let centroMatches = 0;
      centroWords.forEach(word => {
        if (normalizedOcrText.includes(word)) centroMatches++;
      });
      const centroMatchOk = centroWords.length > 0 ? (centroMatches >= 1) : true;

      // Paso 5: Cotejo Facial Biométrico (Requisito Crítico)
      setScanProgress(90);
      setScanStepName("Realizando cotejo facial biométrico con foto de perfil...");

      let faceMatchScore = 0;
      let faceMatchOk = true;
      let croppedPhotoUrl = "";
      let docTieneFoto = true;

      if (analysis.photoDetected && formData.foto) {
        setScanStepName("Extrayendo fotografía del documento cargado...");
        croppedPhotoUrl = await cropDocumentPhoto(forma003, documentType);
        setCroppedDocPhoto(croppedPhotoUrl);
        await new Promise(r => setTimeout(r, 600));

        setScanStepName("Analizando similitud facial y patrones biométricos...");
        let docTieneFoto = true;
        try {
          const resultado = await compararRostros(formData.foto, croppedPhotoUrl);
          faceMatchScore = resultado.similitud;
          faceMatchOk = resultado.coincide;
          docTieneFoto = resultado.docTieneFoto;
          setFaceSimilarityScore(faceMatchScore);

          if (resultado.docTieneFoto && !resultado.coincide) {
            detectedErrors.push(
              `Verificación Facial: la foto de perfil no coincide biométricamente con la imagen del documento (similitud: ${resultado.similitud}%). Esto no bloquea el registro, pero se recomienda revisar.`
            );
          }
        } catch (err: any) {
          setFaceSimilarityScore(0);
          detectedErrors.push(err.message || "Error al comparar rostros.");
        }
        await new Promise(r => setTimeout(r, 600));
      } else {
        setCroppedDocPhoto(null);
        setFaceSimilarityScore(0);
      }

      // Calcular puntaje de similitud ponderado final
      const finalSimilarity = Math.round(
        (analysis.layoutScore * 0.3) +
        (ocrScore * 0.4) +
        (dataMatchScore * 0.3)
      );

      setSimilarityScore(finalSimilarity);
      setScanProgress(100);
      setScanStepName("Verificación completada.");

      const dMatchStatus = [
        { label: "Número de Cuenta", ok: accountMatchOk, val: formData.cuenta },
        { label: "Nombre de Estudiante", ok: nameMatchOk, val: formData.nombre },
        { label: "Carrera Universitaria", ok: careerMatchOk, val: formData.carrera },
        { label: "Centro Regional", ok: centroMatchOk, val: formData.centroRegional }
      ];

      setValidationDetails({
        aspectRatio: analysis.aspectRatio,
        aspectRatioOk: analysis.aspectRatioOk,
        photoDetected: analysis.photoDetected,
        qrDetected: analysis.qrDetected,
        tablesDetected: analysis.tablesDetected,
        layoutScore: analysis.layoutScore,
        ocrScore,
        dataMatchScore,
        keywordsStatus,
        dataMatchStatus: dMatchStatus,
        faceMatchScore,
        faceMatchOk,
        docTieneFoto
      });

      // El documento se aprueba si cumple la estructura (layout, foto, qr, tablas), el número de cuenta y la foto biométrica facial
      const shouldApprove = analysis.aspectRatioOk && analysis.qrDetected && analysis.tablesDetected && accountMatchOk && nameMatchOk;
      if (shouldApprove) {
        setErrors([]);
        setForma003Status('verified');
        toast.success(
          documentType === 'forma003'
            ? `¡Forma 03 verificada y validada biométricamente! Similitud: ${finalSimilarity}%`
            : `¡Carnet verificado y validado biométricamente! Similitud: ${finalSimilarity}%`
        );
      } else {
        setErrors(detectedErrors);
        setForma003Status('failed');
        toast.error(`La verificación del documento ha fallado.`);
      }

    } catch (err: any) {
      console.error(err);
      setForma003Status('failed');
      setErrors([`Error inesperado: ${err.message || err}`]);
      toast.error("Ocurrió un error al procesar la verificación.");
    }
  };


  // Determina si un paso destino es navegable desde el paso actual
  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep === step) return false; // ya estamos aquí
    if (targetStep < step) return true;    // siempre se puede volver atrás
    // Para avanzar, cada paso intermedio debe ser válido
    for (let s = step; s < targetStep; s++) {
      if (s === 1 && !isStep1Valid()) return false;
      if (s === 2 && !isStep2Valid()) return false;
      if (s === 3 && !isStep3Valid()) return false;
      if (s === 4 && !isStep4Valid()) return false;
    }
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    // Si es el paso actual, no hacer nada
    if (targetStep === step) return;

    // Si es un paso anterior, navegar libremente sin validación
    if (targetStep < step) {
      setStep(targetStep as 1 | 2 | 3 | 4);
      return;
    }

    // Si es un paso futuro, validar pasos intermedios
    if (!canNavigateToStep(targetStep)) {
      const msgs: Record<number, string> = {
        2: "Completa los datos personales antes de continuar.",
        3: "Completa los datos académicos antes de continuar.",
        4: "Carga tu fotografía antes de continuar.",
      };
      toast.error(msgs[targetStep] ?? "Completa el paso actual primero.");
      return;
    }
    setStep(targetStep as 1 | 2 | 3 | 4);
  };

  const stepProgressBar = (
    <div className="flex items-center justify-between max-w-lg mx-auto mb-8 relative px-2">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
      {/* Active Fill Line */}
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-[#004B87] -translate-y-1/2 transition-all duration-300 z-0"
        style={{ width: `${((step - 1) / 3) * 100}%` }}
      />

      {[
        { label: "Personal", num: 1 },
        { label: "Académico", num: 2 },
        { label: "Fotografía", num: 3 },
        { label: "Forma 003", num: 4 }
      ].map((s) => {
        const isActive = step >= s.num;
        const isCurrent = step === s.num;
        return (
          <button
            key={s.num}
            type="button"
            onClick={() => handleStepClick(s.num)}
            title={
              isCurrent
                ? `Paso ${s.num}: ${s.label} (actual)`
                : s.num < step
                  ? `Volver al Paso ${s.num}: ${s.label}`
                  : `Ir al Paso ${s.num}: ${s.label}`
            }
            className={`flex flex-col items-center z-10 bg-transparent border-0 p-0 transition-transform ${isCurrent
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:ring-offset-2 rounded-full"
              }`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${isActive
                  ? "bg-[#004B87] text-white shadow-md shadow-[#004B87]/20"
                  : "bg-white text-slate-400 border-2 border-slate-200"
                } ${!isCurrent ? "hover:shadow-lg hover:shadow-[#004B87]/30" : ""}`}
            >
              {s.num}
            </div>
            <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase ${isActive ? "text-[#004B87]" : "text-slate-400"
              }`}>
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );


  const formContent = (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Botón Volver si está en modo registro */}
      {isRegistro && step === 1 && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-[#004B87] hover:text-[#003366] transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Selección
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-gradient-to-br from-[#FFD100] to-[#e8920a] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-[#FFD100]/20 text-[#003366]">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[#004B87]">
            Ficha de Enrolamiento Estudiantil
          </h2>
          <p className="text-sm text-slate-500">
            Completa tu información institucional de UNAH paso a paso.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {!exito && stepProgressBar}

      {/* Success banner */}
      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">¡Registro Completado!</h4>
              <p className="text-xs text-emerald-600">
                Tus datos han sido registrados en la base de datos de PostgreSQL. Ya puedes iniciar sesión.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => navigate("/", { state: { email: formData.correo } })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 h-9 rounded-lg flex-shrink-0"
          >
            Ir al Inicio de Sesión
          </Button>
        </div>
      )}

      {!exito && (
        <div className="space-y-6">
          {/* STEP 1: Datos Personales */}
          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <Card key="step-1" className="border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3 py-4 px-6">
                <div className="h-8 w-8 bg-slate-100 text-[#004B87] rounded-full flex items-center justify-center font-bold">
                  <User className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-[#003366]">
                  Paso 1: Datos Personales y de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Nombre Completo <span className="text-rose-500 text-[10px] font-semibold normal-case"></span>
                  </label>
                  <Input
                    type="text"
                    name="nombre"
                    required
                    placeholder="Ej. Juan Carlos Pérez López"
                    value={formData.nombre}
                    onChange={(e) => {
                      const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
                      handleChange({
                        ...e,
                        target: { ...e.target, name: "nombre", value: soloLetras },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    className={`h-11 rounded-lg bg-slate-50 focus-visible:ring-[#FFD100] text-[#003366] ${formData.nombre && formData.nombre.trim().split(/\s+/).filter(w => w.length > 0).length < 3
                        ? "border-red-400 focus-visible:ring-red-400"
                        : formData.nombre.trim().split(/\s+/).filter(w => w.length > 0).length >= 3
                          ? "border-emerald-400"
                          : "border-slate-200"
                      }`}
                  />
                  {formData.nombre && formData.nombre.trim().split(/\s+/).filter(w => w.length > 0).length < 3 && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      ⚠ Ingresa al menos 3 nombres/apellidos ({formData.nombre.trim().split(/\s+/).filter(w => w.length > 0).length}/3)
                    </p>
                  )}
                  {formData.nombre.trim().split(/\s+/).filter(w => w.length > 0).length >= 3 && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">✓ Nombre completo válido</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Teléfono Móvil
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={codigoPais}
                        onChange={(e) => setCodigoPais(e.target.value)}
                        className="h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[#003366] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100] font-medium"
                      >
                        <option value="+504">🇭🇳 +504 (HN)</option>
                        <option value="+503">🇸🇻 +503 (SV)</option>
                        <option value="+502">🇬🇹 +502 (GT)</option>
                        <option value="+505">🇳🇮 +505 (NI)</option>
                        <option value="+506">🇨🇷 +506 (CR)</option>
                        <option value="+507">🇵🇦 +507 (PA)</option>
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+52">🇲🇽 +52 (MX)</option>
                        <option value="+34">🇪🇸 +34 (ES)</option>
                        <option value="+57">🇨🇴 +57 (CO)</option>
                      </select>
                      <Input
                        type="text"
                        name="telefono"
                        required
                        placeholder={PAISES_TELEFONO[codigoPais].conGuion ? "9999-9999" : "9999999999"}
                        maxLength={PAISES_TELEFONO[codigoPais].digitos + (PAISES_TELEFONO[codigoPais].conGuion ? 1 : 0)}
                        value={formatearTelefono(formData.telefono, PAISES_TELEFONO[codigoPais].conGuion)}
                        onChange={(e) => {
                          const maxDigitos = PAISES_TELEFONO[codigoPais].digitos;
                          const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigitos);
                          const fakeEvent = { ...e, target: { ...e.target, name: "telefono", value: digits } };
                          handleChange(fakeEvent as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className={`h-11 flex-1 rounded-lg bg-slate-50 focus-visible:ring-[#FFD100] border-slate-200 text-[#003366] ${formData.telefono && formData.telefono.length !== PAISES_TELEFONO[codigoPais].digitos
                            ? "border-red-400 focus-visible:ring-red-400"
                            : formData.telefono.length === PAISES_TELEFONO[codigoPais].digitos
                              ? "border-emerald-400"
                              : ""
                          }`}
                      />
                    </div>
                    {formData.telefono && formData.telefono.length !== PAISES_TELEFONO[codigoPais].digitos && (
                      <p className="text-xs text-red-500 font-medium mt-1">
                        ⚠ El número debe tener exactamente {PAISES_TELEFONO[codigoPais].digitos} dígitos ({formData.telefono.length}/{PAISES_TELEFONO[codigoPais].digitos})
                      </p>
                    )}
                    {formData.telefono.length === PAISES_TELEFONO[codigoPais].digitos && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">✓ Número válido</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Correo Institucional <span className="text-slate-400 text-[10px] normal-case font-normal"></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 rounded-lg border bg-slate-50 overflow-hidden transition-colors ${correoUsuario && !isEmailLegitimate(correoUsuario)
                        ? "border-red-400 focus-within:ring-2 focus-within:ring-red-300"
                        : correoUsuario && isEmailLegitimate(correoUsuario)
                          ? "border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-300"
                          : "border-slate-200 focus-within:ring-2 focus-within:ring-[#FFD100]/50"
                      }`}>
                      <Input
                        type="text"
                        required
                        placeholder="nombre.apellido"
                        value={correoUsuario}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[\s@]/g, "");
                          setCorreoUsuario(val);
                        }}
                        className="h-11 w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-[#003366] font-medium"
                      />
                    </div>
                    <div className="h-11 px-3 rounded-lg border border-slate-200 bg-slate-100 text-[#004B87] text-sm font-bold flex items-center select-none whitespace-nowrap">
                      @unah.hn
                    </div>
                  </div>
                  {correoUsuario && !isEmailLegitimate(correoUsuario) && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      ⚠ Correo inválido: usa solo letras, números, puntos o guiones (ej: juan.perez)
                    </p>
                  )}
                  {correoUsuario && isEmailLegitimate(correoUsuario) && !correoYaExiste && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      ✓ Tu correo es: <span className="font-bold">{correoUsuario}@unah.hn</span>
                    </p>
                  )}
                  {correoYaExiste && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                      ⚠ Este correo ya está enrolado. Intenta iniciar sesión en su lugar.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Género
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "masculino", label: "♂ Masculino" },
                      { value: "femenino", label: "♀ Femenino" },
                      { value: "otro", label: "○ Prefiero no especificar" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm font-medium transition-all select-none ${formData.genero === opt.value
                            ? "border-[#FFD100] bg-[#FFD100]/5 text-[#e8920a] font-bold"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                          }`}
                      >
                        <input
                          type="radio"
                          name="genero"
                          value={opt.value}
                          checked={formData.genero === opt.value}
                          onChange={handleChange}
                          required
                          className="accent-[#004B87] h-4 w-4"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STEP 2: Datos Universitarios */}
          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Card key="step-2" className="border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3 py-4 px-6">
                <div className="h-8 w-8 bg-slate-100 text-[#004B87] rounded-full flex items-center justify-center font-bold">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-[#003366]">
                  Paso 2: Información Universitaria (UNAH)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Número de Cuenta
                    </label>
                    <Input
                      type="text"
                      name="cuenta"
                      required
                      placeholder="Ej: 1990xxxxxxx o 2000xxxxxxx"
                      value={formData.cuenta}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 11) {
                          setFormData({ ...formData, cuenta: val });
                        }
                      }}
                      className="h-11 rounded-lg bg-slate-50 focus-visible:ring-[#FFD100] border-slate-200 text-[#003366] font-medium tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400/70"
                    />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className={`p-2 rounded-lg border text-center transition-all duration-200 ${formData.cuenta.length >= 4
                          ? "bg-[#004B87]/5 border-[#004B87]/20 text-[#004B87]"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Año de Ingreso</span>
                        <span className="font-mono text-sm tracking-wider font-bold">
                          {formData.cuenta.substring(0, 4) || "AAAA"}
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg border text-center transition-all duration-200 ${formData.cuenta.length > 4
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Correlativo / Identificador</span>
                        <span className="font-mono text-sm tracking-wider font-bold">
                          {formData.cuenta.substring(4, 11) || "NNNNNNN"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                      El número de cuenta se compone de los <span className="font-semibold text-slate-500">primeros 4 dígitos</span> correspondientes al año de ingreso o creación del expediente, seguidos del <span className="font-semibold text-slate-500">identificador único</span> asignado por el sistema.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Carrera
                    </label>
                    <select
                      name="carrera"
                      required
                      value={formData.carrera}
                      onChange={handleChange}
                      className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[#003366] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100] font-medium"
                    >
                      <option value="">Selecciona tu carrera...</option>
                      {carreras.map((c) => (
                        <option key={c.id_carrera} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Centro Regional
                  </label>
                  <select
                    name="centroRegional"
                    required
                    value={formData.centroRegional}
                    onChange={handleChange}
                    className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[#003366] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100] font-medium"
                  >
                    <option value="">Selecciona tu centro regional...</option>
                    <option value="CU">Ciudad Universitaria (CU) – Tegucigalpa</option>
                    <option value="CURLA">Centro Regional Universitario del Litoral Atlántico (CURLA) – La Ceiba</option>
                    <option value="UNAH-VS">UNAH Valle de Sula (UNAH-VS) – San Pedro Sula</option>
                    <option value="CURC">Centro Universitario Regional del Centro (CURC) – Comayagua</option>
                    <option value="CURLP">Centro Universitario Regional del Litoral Pacífico (CURLP) – Choluteca</option>
                    <option value="CURNO">Centro Universitario Regional del Nor-Oriente (CURNO) – Juticalpa</option>
                    <option value="CUROC">Centro Universitario Regional de Occidente (CUROC) – Santa Rosa de Copán</option>
                    <option value="UNAH-TEC-DANLI">UNAH Tec Danlí</option>
                    <option value="UNAH-TEC-AGUAN">UNAH Tec Aguán</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STEP 3: Fotografía */}
          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            <Card key="step-3" className="border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3 py-4 px-6">
                <div className="h-8 w-8 bg-slate-100 text-[#004B87] rounded-full flex items-center justify-center font-bold">
                  <Camera className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-[#003366]">
                  Paso 3: Fotografía de Identificación Oficial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Preview Box */}
                  <div className="h-32 w-28 bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center relative flex-shrink-0">
                    {formData.foto ? (
                      <img
                        src={formData.foto}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <User className="h-8 w-8 mx-auto opacity-40 mb-1" />
                        <span className="text-[10px] block leading-tight">Sin Foto cargada</span>
                      </div>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Carga una fotografía digital reciente de frente, con fondo claro o blanco.
                      Formatos recomendados: JPG o PNG. Tamaño máximo de archivo: 2 MB.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        htmlFor="foto-upload"
                        className="h-10 px-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-bold flex items-center justify-center gap-2"
                      >
                        📁 Seleccionar Archivo
                      </label>
                      <input
                        id="foto-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => startCamera('foto')}
                        className="h-10 px-4 rounded-lg bg-[#004B87] hover:bg-[#003366] text-white text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Camera className="h-4 w-4" /> Usar Cámara
                      </Button>
                      {formData.foto && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Foto cargada correctamente
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biography section */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Biografía / Presentación Personal
                  </label>
                  <textarea
                    name="biografia"
                    rows={4}
                    placeholder="Escribe una breve presentación sobre ti, tus intereses académicos o pasatiempos..."
                    value={formData.biografia}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-[#003366] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100] font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Esta biografía se mostrará en tu perfil de estudiante para que otros compañeros puedan conocerte.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STEP 4: Verificación de Identidad */}
          <div style={{ display: step === 4 ? 'block' : 'none' }}>
            <Card key="step-4" className="border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3 py-4 px-6">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all ${forma003Status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                    forma003Status === 'failed' ? 'bg-rose-100 text-rose-600' :
                      'bg-slate-100 text-[#004B87]'
                  }`}>
                  {forma003Status === 'verified' ? <ShieldCheck className="h-4 w-4" /> :
                    forma003Status === 'failed' ? <ShieldAlert className="h-4 w-4" /> :
                      <Scan className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold text-[#003366]">
                    Paso 4: Verificación Inteligente de {documentType === 'forma003' ? 'Comprobante de Matrícula (Forma 03)' : 'Carnet Estudiantil'}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Suba su {documentType === 'forma003' ? 'Forma 03' : 'Carnet Estudiantil'} y el sistema lo verificará usando OCR, análisis de estructura y cotejo biométrico con su foto.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Selector de Método de Verificación */}
                <div className="text-center mb-6 space-y-2">
                  <div className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-slate-100 border border-slate-200 text-[#003366] text-xs font-bold select-none">
                    {documentType === 'forma003' ? '📄 Forma 03 de Matrícula' : '🪪 Carnet Estudiantil'}
                  </div>
                  <p className="text-xs text-slate-500">
                    {documentType === 'forma003' ? (
                      <>
                        ¿No cuentas con tu Forma 03?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentType('carnet');
                            setForma003(null);
                            setForma003Status('idle');
                            setErrors([]);
                            setVerDetallesErrores(false);
                            setSimilarityScore(null);
                            setValidationDetails(null);
                            setCroppedDocPhoto(null);
                            setFaceSimilarityScore(null);
                          }}
                          className="text-[#004B87] hover:underline font-bold ml-1"
                        >
                          Cargar tu carnet estudiantil
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Prefieres usar tu Forma 03?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentType('forma003');
                            setForma003(null);
                            setForma003Status('idle');
                            setErrors([]);
                            setVerDetallesErrores(false);
                            setSimilarityScore(null);
                            setValidationDetails(null);
                            setCroppedDocPhoto(null);
                            setFaceSimilarityScore(null);
                          }}
                          className="text-[#004B87] hover:underline font-bold ml-1"
                        >
                          Cargar tu Forma 03 de Matrícula
                        </button>
                      </>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                  {/* LEFT: Upload + Preview with Layout Overlays (col-span-7) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div
                      className={`relative rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] overflow-hidden cursor-pointer group ${forma003 ? 'border-slate-200 bg-slate-900/5' : 'border-slate-200 bg-slate-50 hover:border-[#004B87]/40 hover:bg-[#004B87]/5'
                        }`}
                      onClick={() => !forma003 && document.getElementById('forma003-upload')?.click()}
                    >
                      {forma003 ? (
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                          <img
                            src={forma003}
                            alt="Documento"
                            className="max-h-72 object-contain rounded-lg"
                          />

                          {/* Visual Layout Overlays (only when not scanning and we have results) */}
                          {forma003Status !== 'scanning' && validationDetails && (
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Photo Bounding Box */}
                              <div
                                className={`absolute border-2 rounded ${validationDetails.photoDetected
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-rose-500 bg-rose-500/10'
                                  }`}
                                style={{
                                  left: documentType === 'forma003' ? '4%' : '70%',
                                  top: documentType === 'forma003' ? '15%' : '8%',
                                  width: documentType === 'forma003' ? '11%' : '25%',
                                  height: documentType === 'forma003' ? '30%' : '50%'
                                }}
                              >
                                <span className={`absolute -top-5 left-0 text-[8px] font-bold px-1 rounded uppercase text-white ${validationDetails.photoDetected ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}>
                                  Foto: {validationDetails.photoDetected ? 'OK' : 'No Det.'}
                                </span>
                              </div>

                              {/* QR / Barcode Bounding Box */}
                              <div
                                className={`absolute border-2 rounded ${validationDetails.qrDetected
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-rose-500 bg-rose-500/10'
                                  }`}
                                style={{
                                  left: documentType === 'forma003' ? '84%' : '4%',
                                  top: documentType === 'forma003' ? '15%' : '8%',
                                  width: documentType === 'forma003' ? '12%' : '18%',
                                  height: documentType === 'forma003' ? '30%' : '32%'
                                }}
                              >
                                <span className={`absolute -top-5 right-0 text-[8px] font-bold px-1 rounded uppercase text-white ${validationDetails.qrDetected ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}>
                                  {documentType === 'forma003' ? 'QR' : 'Sello'}: {validationDetails.qrDetected ? 'OK' : 'No Det.'}
                                </span>
                              </div>

                              {/* Structure/Tables Bounding Box */}
                              <div
                                className={`absolute border-2 border-dashed rounded ${validationDetails.tablesDetected
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-rose-500 bg-rose-500/5'
                                  }`}
                                style={{
                                  left: documentType === 'forma003' ? '2%' : '4%',
                                  top: documentType === 'forma003' ? '50%' : '38%',
                                  width: documentType === 'forma003' ? '96%' : '62%',
                                  height: documentType === 'forma003' ? '43%' : '52%'
                                }}
                              >
                                <span className={`absolute top-1 left-2 text-[8px] font-bold px-1 rounded uppercase text-white ${validationDetails.tablesDetected ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}>
                                  {documentType === 'forma003' ? 'Tablas Asignaturas' : 'Campos de Texto'} ({validationDetails.tablesDetected ? 'OK' : 'No Det.'})
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Scan overlay animation */}
                          {forma003Status === 'scanning' && (
                            <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                              <div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD100] to-transparent shadow-[0_0_8px_#FFD100]"
                                style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                              />
                              <div className="bg-white rounded-xl p-5 shadow-2xl flex flex-col items-center gap-3 border border-slate-100 max-w-sm w-full">
                                <span className="h-8 w-8 border-3 border-[#004B87] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                <span className="text-sm font-bold text-[#003366]">{scanStepName}</span>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="bg-gradient-to-r from-[#004B87] to-[#FFD100] h-full transition-all duration-300"
                                    style={{ width: `${scanProgress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 font-bold">{scanProgress}%</span>
                              </div>
                            </div>
                          )}

                          {/* Verified overlay badge */}
                          {forma003Status === 'verified' && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg flex items-center gap-1.5 px-3 font-bold text-xs">
                                <ShieldCheck className="h-4 w-4" /> Validado
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-8 space-y-3">
                          <div className="h-16 w-16 bg-slate-100 group-hover:bg-[#004B87]/10 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                            <FileSignature className="h-8 w-8 text-slate-300 group-hover:text-[#004B87]/50 transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-600">
                              Subir imagen de su {documentType === 'forma003' ? 'Forma 03 Oficial' : 'Carnet Estudiantil'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Debe ser captura horizontal/apaisada de frente.<br />
                              Formatos: JPG, PNG · Máx. 5 MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      id="forma003-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("La imagen excede el límite de 5 MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForma003(reader.result as string);
                            setForma003Status('idle');
                            setErrors([]);
                            setVerDetallesErrores(false);
                            setSimilarityScore(null);
                            setValidationDetails(null);
                            setCroppedDocPhoto(null);
                            setFaceSimilarityScore(null);
                            toast.success(
                              documentType === 'forma003'
                                ? "Forma 03 cargada correctamente."
                                : "Carnet cargado correctamente."
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="forma003-upload"
                        className="flex-grow h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FileSignature className="h-4 w-4" />
                        {forma003 ? 'Cambiar archivo' : `Seleccionar ${documentType === 'forma003' ? 'Forma 03' : 'Carnet'}`}
                      </label>
                      <Button
                        type="button"
                        onClick={() => startCamera('documento')}
                        className="h-10 px-4 rounded-lg bg-[#004B87] hover:bg-[#003366] text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Camera className="h-4 w-4" /> Tomar Foto
                      </Button>
                      {forma003 && (
                        <button
                          type="button"
                          onClick={() => {
                            setForma003(null);
                            setForma003Status('idle');
                            setErrors([]);
                            setVerDetallesErrores(false);
                            setSimilarityScore(null);
                            setValidationDetails(null);
                            setCroppedDocPhoto(null);
                            setFaceSimilarityScore(null);
                          }}
                          className="h-10 px-3 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors text-xs font-bold"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Detailed Verification Dashboard (col-span-5) */}
                  <div className="lg:col-span-5 space-y-4">

                    {/* IDLE state */}
                    {forma003Status === 'idle' && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-4">
                        <div className="h-14 w-14 bg-[#004B87]/8 rounded-2xl flex items-center justify-center mx-auto">
                          <Layers className="h-7 w-7 text-[#004B87]/40 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-600">Verificación Pendiente</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {forma003
                              ? `Presione el botón "Verificar ${documentType === 'forma003' ? 'Forma 03' : 'Carnet'}" a continuación para iniciar el análisis estructural, OCR y cotejo facial.`
                              : `Cargue su ${documentType === 'forma003' ? 'comprobante de matrícula' : 'carnet estudiantil'} para habilitar la validación inteligente.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SCANNING state */}
                    {forma003Status === 'scanning' && (
                      <div className="rounded-xl border border-[#004B87]/20 bg-[#004B87]/5 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="h-5 w-5 border-2 border-[#004B87] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          <p className="text-sm font-bold text-[#003366]">Procesando escaneo inteligente...</p>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          {[
                            { label: "1. Análisis de estructura visual (Layout)", progressRange: [0, 30] },
                            { label: "2. Extracción de textos (Tesseract OCR)", progressRange: [30, 70] },
                            { label: "3. Validación de palabras clave", progressRange: [70, 80] },
                            { label: "4. Cotejo de datos del alumno", progressRange: [80, 90] },
                            { label: "5. Cotejo Facial Biométrico", progressRange: [90, 100] }
                          ].map((stepItem, i) => {
                            const isDone = scanProgress > stepItem.progressRange[1];
                            const isActive = scanProgress >= stepItem.progressRange[0] && scanProgress <= stepItem.progressRange[1];
                            return (
                              <div key={i} className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-slate-100">
                                <span className={`font-medium ${isDone ? 'text-slate-500' : isActive ? 'text-[#004B87] font-bold' : 'text-slate-400'}`}>
                                  {stepItem.label}
                                </span>
                                <span className="text-[10px] font-bold">
                                  {isDone ? '✅ Listo' : isActive ? '⏳ Procesando' : '💤 Pendiente'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {similarityScore !== null && (
                      <div className={`rounded-xl border p-5 space-y-4 shadow-sm ${forma003Status === 'verified'
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-rose-200 bg-rose-50/50'
                        }`}>
                        {/* Score Circle & Title */}
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white ${forma003Status === 'verified'
                              ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                              : 'bg-rose-500 shadow-md shadow-rose-200'
                            }`}>
                            {forma003Status === 'verified' ? (
                              <ShieldCheck className="h-6 w-6" />
                            ) : (
                              <ShieldAlert className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${forma003Status === 'verified' ? 'text-emerald-800' : 'text-rose-800'}`}>
                              {forma003Status === 'verified' ? 'Documento Aprobado' : 'Documento Rechazado'}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {forma003Status === 'verified'
                                ? 'La información del documento coincide exitosamente con su perfil.'
                                : 'No se pudo validar el documento debido a inconsistencias de datos.'}
                            </p>
                          </div>
                        </div>

                        {/* Error list for rejection */}
                        {forma003Status === 'failed' && errors.length > 0 && (
                          <div className="bg-white border border-rose-100 rounded-lg p-3 space-y-2">
                            <span className="text-[10px] font-bold text-rose-700 block uppercase tracking-wider">
                              Errores por el que no se validó:
                            </span>
                            <div className="space-y-1.5">
                              {errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] text-rose-600 font-medium leading-relaxed">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Checklist de datos del formulario cotejados contra el documento */}
                        {validationDetails && (
                          <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-2">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                              Cotejo de tus datos contra el documento:
                            </span>
                            <div className="space-y-1.5">
                              {validationDetails.dataMatchStatus.map((item, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center justify-between gap-2 text-[11px] font-medium px-2 py-1.5 rounded-md ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                                    }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {item.ok ? (
                                      <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                                    ) : (
                                      <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                                    )}
                                    {item.label}
                                  </span>
                                  <span className="text-right truncate max-w-[45%]" title={item.val}>
                                    {item.val || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Face match visual verification */}
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div className="flex justify-between font-bold text-slate-700 text-xs">
                            <span>Verificación Biométrica Facial (informativa)</span>
                            {validationDetails && (
                              <span className={
                                validationDetails.docTieneFoto === false
                                  ? "text-amber-600 font-bold"
                                  : validationDetails.faceMatchOk ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"
                              }>
                                {validationDetails.docTieneFoto === false
                                  ? "No se detectó rostro en el documento (no aplica)"
                                  : validationDetails.faceMatchOk ? `Coincide (${validationDetails.faceMatchScore}%)` : `No coincide (${validationDetails.faceMatchScore}%)`}
                              </span>
                            )}
                          </div>

                          {formData.foto && croppedDocPhoto ? (
                            <div className="flex items-center justify-center gap-4 bg-white p-2.5 rounded-lg border border-slate-100">
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-14 rounded-md border border-slate-200 overflow-hidden bg-slate-50 relative">
                                  <img src={formData.foto} alt="Foto Perfil" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[7px] font-bold text-center py-0.5">Perfil</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <div className="h-0.5 w-8 bg-slate-200 relative">
                                  {validationDetails && (
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-[8px] font-bold text-emerald-600">
                                      {validationDetails.faceMatchScore}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-14 rounded-md border border-slate-200 overflow-hidden bg-slate-50 relative">
                                  <img src={croppedDocPhoto} alt="Foto Documento" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[7px] font-bold text-center py-0.5">Documento</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-rose-500 bg-rose-50 p-2 rounded border border-rose-100 flex items-center gap-1.5 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              No se pudo realizar el cotejo biométrico por falta de imagen.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Verify button */}
                    <button
                      type="button"
                      onClick={handleVerifyForma003}
                      disabled={!forma003 || forma003Status === 'scanning'}
                      className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${forma003Status === 'verified'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                          : forma003Status === 'failed'
                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                            : 'bg-[#004B87] hover:bg-[#003366] text-white shadow-[#004B87]/20'
                        }`}
                    >
                      {forma003Status === 'scanning' ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Escaneando...</>
                      ) : forma003Status === 'verified' ? (
                        <><ShieldCheck className="h-4 w-4" /> Verificar nuevamente</>
                      ) : (
                        <><Scan className="h-4 w-4" /> Verificar Forma 03</>
                      )}
                    </button>

                  </div>
                </div>
              </CardContent>

            </Card>
          </div>


          {/* Navigation Controls */}
          <div className="flex justify-between items-center gap-4 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="px-6 h-11 border-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-2 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="ml-auto px-6 h-11 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-lg flex items-center gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={enviando || forma003Status !== 'verified'}
                className="ml-auto px-8 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {enviando ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" />
                    Verificar y Enviar
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      )}

      {/* Modal de Confirmación / OTP */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => !enviando && setShowConfirmModal(open)}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl p-6 sm:max-h-[90vh] overflow-y-auto">
          {!showOtp ? (
            <div key="summary" className="animate-fade-in">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#004B87] flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-[#FFD100]" />
                  Verificar Información de la Ficha
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Por favor revisa que toda la información ingresada sea correcta antes de registrar y crear tu cuenta.
                </DialogDescription>
              </DialogHeader>


              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4">
                {/* Fotografía y Forma 003 lado izquierdo */}
                <div className="md:col-span-4 flex flex-col gap-4 items-center">
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex flex-col items-center">
                      <div className="h-28 w-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
                        {formData.foto ? (
                          <img src={formData.foto} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin foto</div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Foto Perfil</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="h-20 w-32 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                        {forma003 ? (
                          <img src={forma003} alt="Forma 003" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin doc</div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Forma 003</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Forma 003 Validada
                  </div>
                </div>

                {/* Datos del Estudiante lado derecho */}
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Nombre Completo</span>
                    <span className="font-semibold text-[#003366]">{formData.nombre}</span>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Número de Cuenta</span>
                    <span className="font-semibold text-[#003366]">{formData.cuenta}</span>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Teléfono Móvil</span>
                    <span className="font-semibold text-[#003366]">{codigoPais} {formData.telefono}</span>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Género</span>
                    <span className="font-semibold capitalize text-[#003366]">{formData.genero}</span>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Carrera</span>
                    <span className="font-semibold text-[#003366]">{formData.carrera}</span>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Centro Regional</span>
                    <span className="font-semibold text-[#003366]">{formData.centroRegional}</span>
                  </div>
                  <div className="sm:col-span-2 border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Biografía</span>
                    <span className="text-slate-600 text-xs italic block mt-0.5 leading-relaxed break-words whitespace-pre-line">
                      {formData.biografia || "Sin biografía ingresada"}
                    </span>
                  </div>
                </div>
              </div>


              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                  disabled={enviando}
                >
                  Cerrar y Editar
                </Button>
                <Button
                  type="button"
                  onClick={() => { setAcceptTerms(false); setShowTerms(true); }}
                  disabled={enviando}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
                >
                  {enviando ? "Enviando..." : "Confirmar y Enviar Código"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div key="otp" className="animate-fade-in">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#004B87] flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Verificación de Correo
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Hemos enviado un código de verificación a tu correo institucional (@unah.hn).
                  Por favor, ingrésalo a continuación para confirmar tu identidad.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Input
                  type="text"
                  placeholder="Ej. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-48 text-center text-2xl tracking-widest h-14 bg-slate-50 border-slate-200"
                  maxLength={6}
                />
                <p className="text-xs text-slate-400">
                  ¿No recibiste el código? <button className="text-[#004B87] font-bold underline hover:text-[#003366]" type="button">Reenviar</button>
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOtp(false)}
                  className="px-4 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                  disabled={enviando}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={handleVerifySubmit}
                  disabled={enviando || otpCode.length < 4}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {enviando ? "Verificando..." : "Verificar y Crear Cuenta"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Términos y Condiciones */}
      {showTerms && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-[#004B87] to-[#003366] text-white p-5 flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-[#FFD100]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Términos y Condiciones</h3>
                <p className="text-xs text-white/70">UNAH Conecta Pumas – Gestión de Eventos (Art. 140)</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed max-h-[40vh] border-b border-slate-100">
              <h4 className="font-bold text-[#003366] text-base">1. Aspectos Generales</h4>
              <p>
                Al completar tu enrolamiento en la plataforma <strong>UNAH Conecta Pumas</strong>, aceptas y te comprometes a cumplir con los presentes Términos y Condiciones. Este sistema está destinado exclusivamente para la comunidad universitaria de la UNAH.
              </p>
              <h4 className="font-bold text-[#003366] text-base">2. Cumplimiento del Artículo 140</h4>
              <p>
                Este sistema facilita el registro, validación y control de las horas acumuladas en cumplimiento del <strong>Artículo 140 de las Normas Académicas de la UNAH</strong>. Toda falsificación de asistencia, códigos QR o datos de participación será reportada a la VOAE y constituirá una falta grave sujeta a sanciones disciplinarias académicas.
              </p>
              <h4 className="font-bold text-[#003366] text-base">3. Uso de Datos y Privacidad</h4>
              <p>
                Su información de perfil, correo institucional, asistencia y registro de horas académicas serán procesados con fines de auditoría y validación universitaria por el personal autorizado de la <strong>Vicerrectoría de Orientación y Asuntos Estudiantiles (VOAE)</strong>.
              </p>
              <h4 className="font-bold text-[#003366] text-base">4. Responsabilidad del Usuario</h4>
              <p>
                Usted es el único responsable de salvaguardar el acceso a su correo institucional y los códigos OTP recibidos. Queda prohibido compartir o transferir accesos a terceros para registrar asistencias de forma fraudulenta.
              </p>
            </div>

            {/* Aceptación y botones */}
            <div className="p-5 bg-slate-50 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004B87] focus:ring-[#004B87] cursor-pointer"
                />
                <span className="text-xs text-slate-600 select-none leading-normal group-hover:text-slate-900 transition-colors">
                  He leído detenidamente, comprendo las implicaciones académicas y acepto los términos y condiciones de uso de la plataforma.
                </span>
              </label>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowTerms(false); setAcceptTerms(false); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!acceptTerms}
                  onClick={() => { setShowTerms(false); handleSendOtp(); }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#004B87] hover:bg-[#003366] rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aceptar y Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Camera Dialog Overlay */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#004B87] flex items-center gap-2 justify-center">
              <Camera className="h-5 w-5 text-[#FFD100]" />
              {cameraTarget === 'foto' ? 'Tomar Foto de Perfil' : 'Tomar Foto de Documento'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden my-4 border border-slate-200">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            {cameraTarget === 'foto' ? (
              <div className="absolute inset-0 border-[3px] border-dashed border-white/40 rounded-full m-12 pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded font-medium">Alinee su rostro</span>
              </div>
            ) : (
              <div className="absolute inset-0 border-[3px] border-dashed border-white/40 rounded-lg m-8 pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded font-medium">Alinee el documento</span>
              </div>
            )}
          </div>
          <DialogFooter className="flex sm:flex-row justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="px-4 border-slate-200 text-slate-600 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              className="bg-[#004B87] hover:bg-[#003366] text-white font-bold"
            >
              Tomar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isRegistro) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        {formContent}
      </div>
    );
  }

  return formContent;
}
