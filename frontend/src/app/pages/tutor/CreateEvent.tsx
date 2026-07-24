import { useNavigate } from "react-router";
import { EventForm } from "../../components/app/EventForm";

export function CreateEvent() {
  const navigate = useNavigate();

  return (
    <EventForm
      onClose={() => navigate("/tutor/eventos")}
    />
  );
}
