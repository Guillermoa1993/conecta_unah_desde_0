import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/voae/")({
  component: VoaeIndex,
});

function VoaeIndex() {
  return <Navigate to="/voae/muro" replace />;
}
