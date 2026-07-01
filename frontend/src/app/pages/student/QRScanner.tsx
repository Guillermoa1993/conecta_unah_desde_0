import { useState } from "react";
import { QrCode, CheckCircle2, XCircle, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

type ScanStatus = "idle" | "scanning" | "success" | "error";

export function QRScanner() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scannedEvent, setScannedEvent] = useState<string | null>(null);

  const handleStartScan = () => {
    setScanStatus("scanning");
    // Simulate scanning delay
    setTimeout(() => {
      // Simulate successful scan
      const success = Math.random() > 0.3;
      if (success) {
        setScanStatus("success");
        setScannedEvent("Taller de Desarrollo Web con React");
        toast.success("¡Asistencia registrada exitosamente!");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setScanStatus("error");
        toast.error("Código QR inválido o expirado");
      }
    }, 2000);
  };

  const handleReset = () => {
    setScanStatus("idle");
    setScannedEvent(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#004B87]">Escanear Código QR</h1>
        <p className="text-muted-foreground mt-1">
          Valida tu asistencia escaneando el código QR del evento
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#004B87] to-[#003366] text-white">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Escáner QR
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Scanner Display */}
            <div className="relative w-full aspect-square max-w-sm bg-gray-900 rounded-lg overflow-hidden">
              {scanStatus === "idle" && (
                <div className="flex items-center justify-center h-full">
                  <Camera className="h-24 w-24 text-gray-600" />
                </div>
              )}

              {scanStatus === "scanning" && (
                <motion.div
                  className="flex items-center justify-center h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative">
                    <div className="h-48 w-48 border-4 border-[#FFD100] rounded-lg"></div>
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-1 bg-[#FFD100]"
                      animate={{
                        y: [0, 192, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {scanStatus === "success" && (
                <motion.div
                  className="flex items-center justify-center h-full bg-green-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle2 className="h-32 w-32 text-white" />
                </motion.div>
              )}

              {scanStatus === "error" && (
                <motion.div
                  className="flex items-center justify-center h-full bg-red-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <XCircle className="h-32 w-32 text-white" />
                </motion.div>
              )}
            </div>

            {/* Status Message */}
            {scanStatus === "scanning" && (
              <motion.p
                className="text-center text-lg text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Escaneando código QR...
              </motion.p>
            )}

            {scanStatus === "success" && scannedEvent && (
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                  ¡Asistencia Confirmada!
                </h3>
                <p className="text-muted-foreground">{scannedEvent}</p>
                <p className="text-sm text-muted-foreground">
                  Tu asistencia ha sido registrada exitosamente
                </p>
              </div>
            )}

            {scanStatus === "error" && (
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-red-600">Error de Validación</h3>
                <p className="text-muted-foreground">
                  El código QR es inválido o ha expirado
                </p>
                <p className="text-sm text-muted-foreground">
                  Por favor, intenta nuevamente o contacta al tutor
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 w-full max-w-sm">
              {scanStatus === "idle" && (
                <Button
                  onClick={handleStartScan}
                  className="flex-1 bg-[#004B87] hover:bg-[#003366]"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Iniciar Escaneo
                </Button>
              )}

              {(scanStatus === "success" || scanStatus === "error") && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white"
                >
                  Escanear Otro Código
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Asegúrate de estar en el evento al momento de escanear</p>
          <p>2. Haz clic en "Iniciar Escaneo" y apunta tu cámara al código QR</p>
          <p>3. Mantén el código centrado en el área de escaneo</p>
          <p>4. Espera la confirmación de asistencia</p>
          <p className="text-amber-600 font-medium">
            Nota: El código QR tiene una validez limitada y solo puede escanearse durante el
            evento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
