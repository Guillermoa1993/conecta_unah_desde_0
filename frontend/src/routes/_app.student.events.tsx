import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/student/events")({
  component: StudentEventsLayout,
});

function StudentEventsLayout() {
  return <Outlet />;
}
