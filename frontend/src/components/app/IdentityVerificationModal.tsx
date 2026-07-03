import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface IdentityVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentId: string;
  studentCareer: string;
  onConfirm: () => void;
}

export function IdentityVerificationModal({
  open,
  onOpenChange,
  studentName,
  studentId,
  studentCareer,
  onConfirm,
}: IdentityVerificationModalProps) {
  const [noMatchPressed, setNoMatchPressed] = useState(false);

  const initials = studentName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleConfirm = () => {
    setNoMatchPressed(false);
    onConfirm();
    onOpenChange(false);
  };

  const handleNoMatch = () => {
    setNoMatchPressed(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setNoMatchPressed(false);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Verificar identidad</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="size-32 rounded-full grid place-items-center text-3xl font-bold text-white"
            style={{
              backgroundColor: "var(--puma-blue)",
              border: `4px solid ${noMatchPressed ? "#ef4444" : "#22c55e"}`,
            }}
          >
            {initials}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{studentName}</p>
            <p className="font-mono text-sm text-muted-foreground mt-0.5">{studentId}</p>
            <p className="text-sm text-muted-foreground">{studentCareer}</p>
          </div>
        </div>
        {noMatchPressed && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
            style={{ backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
          >
            <AlertTriangle className="size-5 shrink-0" />
            <span>Verifica que el estudiante esté escaneando su propio QR</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            className="text-white w-full"
            style={{ backgroundColor: "#22c55e" }}
            onClick={handleConfirm}
          >
            Confirmar identidad
          </Button>
          <Button
            variant="outline"
            className="w-full"
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
            onClick={handleNoMatch}
          >
            No coincide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
