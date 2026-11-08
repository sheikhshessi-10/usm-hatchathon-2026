import { useCare, type Task } from "../data/workflow";
export function CareAction({ task, actor }: { task: Task; actor: Task["owner"] }) {
  const { acceptTask, completeTask } = useCare();
  if (task.completed) return <p className="mt-2 text-xs text-green">Completion recorded{task.completedAt ? ` · ${new Date(task.completedAt).toLocaleString()}` : " in synthetic history"}.</p>;
  if (task.owner !== actor) return <p className="mt-2 text-xs text-body">Awaiting {task.owner.toLowerCase()}{task.acceptedAt ? " action" : " acceptance and action"}.</p>;
  if (task.source === "doctor" && !task.acceptedAt) return <button className="mt-2 rounded-lg bg-hover px-3 py-2 text-xs font-bold text-navy" onClick={() => acceptTask(task.id, actor)}>Accept assigned care action</button>;
  return <div>{task.acceptedAt && <p className="mt-2 text-xs text-body">Accepted by {task.acceptedBy} · {new Date(task.acceptedAt).toLocaleString()}</p>}<button className="mt-2 rounded-lg bg-hover px-3 py-2 text-xs font-bold text-navy" onClick={() => completeTask(task.id, actor)}>Record action completed</button></div>;
}
