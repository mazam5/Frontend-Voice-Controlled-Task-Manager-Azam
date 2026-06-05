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
      timeZone: "UTC",
    });

  const formatTaskDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const datePart = d.toISOString().split("T")[0];
    
    const now = new Date();
    const nowPart = now.toISOString().split("T")[0];
    
    if (datePart === nowPart) return "Today";
    
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowPart = tomorrow.toISOString().split("T")[0];
    if (datePart === tomorrowPart) return "Tomorrow";
    
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div
      className={`glass-card p-4 rounded-xl flex items-center justify-between border-l-4 ${
        task.completed
          ? "border-l-emerald-500 opacity-60"
          : "border-l-indigo-500"
      }`}
    >
      <div className="flex-1 mr-4">
        <h4
          className={`font-semibold text-slate-100 ${
            task.completed ? "line-through text-slate-400" : ""
          }`}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTaskTime(task.scheduled_at)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatTaskDay(task.scheduled_at)}
          </span>
          {task.completed ? (
            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Completed
            </span>
          ) : (
            <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Pending
            </span>
          )}
        </div>
      </div>
      <div>
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-500" />
        )}
      </div>
    </div>
  );
};
