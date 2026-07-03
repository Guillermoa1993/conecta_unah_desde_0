import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tutor/")({
  component: TutorIndex,
});

function TutorIndex() {
  return <Navigate to="/student/muro" replace />;
}
