import { CircleCheck, CircleX } from 'lucide-react';

interface FormAlertProps {
  success: boolean;
  message: string;
}

export function FormAlert({ success, message }: FormAlertProps) {
  const Icon = success ? CircleCheck : CircleX;
  // Use slightly more vibrant/modern alert colors
  const colorClasses = success
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200'
    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200';

  return (
    <div
      role="alert"
      className={`flex items-start gap-4 rounded-lg border p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${colorClasses}`}
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{success ? 'Success' : 'Error'}</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  );
}
