import type { Task } from "@/lib/api";
import { Clock, Calendar, CheckCircle2, Circle } from "lucide-react";

interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const formatTaskTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatTaskDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("en-CA"); // Local YYYY-MM-DD
    
    const now = new Date();
    const nowPart = now.toLocaleDateString("en-CA");
    
    if (datePart === nowPart) return "Today";
    
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowPart = tomorrow.toLocaleDateString("en-CA");
    if (datePart === tomorrowPart) return "Tomorrow";
    
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTimeOfDay = (dateStr: string) => {
    const hour = new Date(dateStr).getHours();
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    return "Evening";
  };

  const getTimeOfDayColor = (timeOfDay: string) => {
    if (timeOfDay === "Morning") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (timeOfDay === "Afternoon") return "text-sky-400 bg-sky-500/10 border-sky-500/20";
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  };

  const timeOfDay = getTimeOfDay(task.scheduled_at);
  const badgeColor = getTimeOfDayColor(timeOfDay);

  return (
    <div
      className={`glass-card p-3 rounded-xl flex items-center justify-between border-l-4 transition-all duration-300 ${
        task.completed
          ? "border-l-emerald-500 bg-slate-950/10 opacity-70"
          : "border-l-indigo-500"
      }`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {/* Visual-only Checkbox */}
        <div className="mr-3 text-slate-500 flex items-center shrink-0">
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={`font-semibold text-sm text-slate-100 truncate ${
              task.completed ? "line-through text-slate-500" : ""
            }`}
          >
            {task.title}
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              {formatTaskTime(task.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" />
              {formatTaskDay(task.scheduled_at)}
            </span>
            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {timeOfDay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
