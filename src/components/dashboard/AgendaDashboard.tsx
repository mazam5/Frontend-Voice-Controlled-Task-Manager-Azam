import type { Task } from "@/lib/api";
import { Info } from "lucide-react";
import { TaskItem } from "./TaskItem";

interface AgendaDashboardProps {
  tasks: Task[];
}

export const AgendaDashboard = ({ tasks }: AgendaDashboardProps) => {
  const getGroupedTasks = () => {
    const overdue: Task[] = [];
    const pending: Task[] = [];
    const done: Task[] = [];
    const now = new Date();

    tasks.forEach((t) => {
      if (t.completed) {
        done.push(t);
      } else {
        const scheduledTime = new Date(t.scheduled_at).getTime();
        if (scheduledTime < now.getTime()) {
          overdue.push(t);
        } else {
          pending.push(t);
        }
      }
    });

    return { overdue, pending, done };
  };

  const { overdue, pending, done } = getGroupedTasks();

  return (
    <div className="flex-1 flex flex-col glass-panel rounded-2xl p-4 overflow-hidden h-full min-h-[380px] md:min-h-0">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div>
          <h2 className="font-bold text-base text-slate-200">Agenda Dashboard</h2>
          <p className="text-[10px] text-slate-400">Voice-Controlled Tasks</p>
        </div>
        <div className="bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-300">
          {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 custom-scrollbar">
        {[
          {
            label: "Overdue Tasks (Missed)",
            color: "bg-rose-500",
            shadow: "rgba(239,68,68,0.5)",
            items: overdue,
            empty: "No overdue tasks",
          },
          {
            label: "Pending Tasks (Upcoming)",
            color: "bg-indigo-400",
            shadow: "rgba(129,140,248,0.5)",
            items: pending,
            empty: "No pending tasks",
          },
          {
            label: "Completed Tasks (Done)",
            color: "bg-emerald-400",
            shadow: "rgba(52,211,153,0.5)",
            items: done,
            empty: "No completed tasks yet",
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
                items.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                  />
                ))
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
          <span>• "Delete the gym task"</span>
          <span>• "Mark gym as complete"</span>
        </div>
      </div>
    </div>
  );
};
