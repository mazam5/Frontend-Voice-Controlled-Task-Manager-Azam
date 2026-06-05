import type { Task } from "@/lib/api";
import { Info } from "lucide-react";
import { TaskItem } from "./TaskItem";

interface AgendaDashboardProps {
  tasks: Task[];
  mobileTab: "orb" | "chat" | "agenda";
}

export const AgendaDashboard = ({ tasks, mobileTab }: AgendaDashboardProps) => {
  const getGroupedTasks = () => {
    const morning: Task[] = [];
    const afternoon: Task[] = [];
    const evening: Task[] = [];

    tasks.forEach((t) => {
      const hour = new Date(t.scheduled_at).getUTCHours();
      if (hour >= 6 && hour < 12) morning.push(t);
      else if (hour >= 12 && hour < 17) afternoon.push(t);
      else evening.push(t);
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = getGroupedTasks();

  return (
    <div
      className={`flex-1 flex flex-col glass-panel rounded-2xl p-4 overflow-hidden h-full ${
        mobileTab === "agenda" ? "flex" : "hidden"
      } md:flex`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div>
          <h2 className="font-bold text-base text-slate-200">Agenda Dashboard</h2>
          <p className="text-[10px] text-slate-400">Voice & Text CRUD</p>
        </div>
        <div className="bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-300">
          {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 custom-scrollbar">
        {[
          {
            label: "Morning Agenda (6:00 AM – 12:00 PM)",
            color: "bg-amber-400",
            shadow: "rgba(251,191,36,0.5)",
            items: morning,
            empty: "No morning tasks scheduled",
          },
          {
            label: "Afternoon Agenda (12:00 PM – 5:00 PM)",
            color: "bg-sky-400",
            shadow: "rgba(56,189,248,0.5)",
            items: afternoon,
            empty: "No afternoon tasks scheduled",
          },
          {
            label: "Evening & Night (5:00 PM – 6:00 AM)",
            color: "bg-purple-400",
            shadow: "rgba(192,132,252,0.5)",
            items: evening,
            empty: "No evening tasks scheduled",
          },
        ].map(({ label, color, shadow, items, empty }) => (
          <div key={label}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${color}`}
                style={{ boxShadow: `0 0 6px ${shadow}` }}
              />
              {label}
            </h3>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="text-xs text-slate-600 italic p-3 rounded-lg border border-slate-900/50 bg-slate-950/20">
                  {empty}
                </div>
              ) : (
                items.map((task) => <TaskItem key={task.id} task={task} />)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 mt-3 bg-slate-950/30 p-2.5 rounded-xl border border-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Try Saying:</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-relaxed flex flex-col gap-1">
          <span>• "Create task gym tomorrow at 7 AM"</span>
          <span>• "What is my agenda for today?"</span>
          <span>• "Change the gym task to 9 AM"</span>
          <span>• "Delete the 9:15 AM task"</span>
          <span>• "Mark gym as complete"</span>
        </div>
      </div>
    </div>
  );
};
