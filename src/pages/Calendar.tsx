import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateClickArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { useJobs } from "../hooks/useJobs";
import PageMeta from "../components/common/PageMeta";

interface JobCalendarEvent extends EventInput {
  extendedProps: {
    jobId: number;
    status: string;
    paid: boolean;
    calendar: "success" | "warning" | "primary" | "danger";
  };
}

const normalizeStatus = (status?: string) => {
  if (!status) return "Pending";
  if (status === "In Progress") return "In_Progress";
  return status;
};

const statusToCalendarColor = (
  status: string
): JobCalendarEvent["extendedProps"]["calendar"] => {
  switch (status) {
    case "Completed":
      return "success";
    case "Cancelled":
      return "danger";
    case "In_Progress":
      return "primary";
    default:
      return "warning";
  }
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const { jobs, loading, error } = useJobs();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const events = useMemo<JobCalendarEvent[]>(() => {
    return jobs
      .filter((job) => Boolean(job.dueDate || job.createdAt))
      .map((job) => {
        const status = normalizeStatus(job.status);
        const eventDate = job.dueDate || job.createdAt!;
        const make = job.vehicle?.make?.trim() || "";
        const titleParts = [`Job #${job.id}`];

        if (make) titleParts.push(make);

        return {
          id: String(job.id),
          title: titleParts.join(" - "),
          start: eventDate,
          allDay: true,
          extendedProps: {
            jobId: job.id,
            status,
            paid: !!job.paid,
            calendar: statusToCalendarColor(status),
          },
        };
      });
  }, [jobs]);

  const handleDateClick = (clickInfo: DateClickArg) => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView("timeGridDay", clickInfo.dateStr);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const jobId = clickInfo.event.extendedProps.jobId;
    if (jobId) navigate(`/view-job/${jobId}`);
  };

  return (
    <>
      <PageMeta
        title="Kaza Dashboard - Calendar"
        description="Jobs calendar"
      />

      {loading ? (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading jobs...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load jobs: {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: isMobile ? "prev,next" : "prev,next today createJobButton",
              center: "title",
              right: isMobile ? "today createJobButton" : "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={
              isMobile
                ? {
                    today: "Today",
                    dayGridMonth: "Month",
                    timeGridWeek: "Week",
                    timeGridDay: "Day",
                  }
                : undefined
            }
            events={events}
            height="auto"
            dayMaxEventRows={isMobile ? 2 : 4}
            moreLinkClick="day"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={(eventInfo) => renderEventContent(eventInfo, isMobile)}
            customButtons={{
              createJobButton: {
                text: isMobile ? "New Job +" : "Create Job +",
                click: () => navigate("/create-job"),
              },
            }}
          />
        </div>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any, isMobile: boolean) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar}`;

  if (isMobile) {
    return (
      <div className={`event-fc-color flex fc-event-main ${colorClass} rounded-sm`}>
        <div className="fc-event-title">{String(eventInfo.event.extendedProps.jobId)}</div>
      </div>
    );
  }

  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot" />
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
