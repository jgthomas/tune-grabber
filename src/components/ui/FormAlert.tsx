import { CircleCheck, CircleX } from 'lucide-react';

interface FormAlertProps {
  success: boolean;
  message: string;
}

export function FormAlert({ success, message }: FormAlertProps) {
  const Icon = success ? CircleCheck : CircleX;
  const colorClasses = success
    ? 'bg-green-100/50 border-green-200/80 text-green-800 dark:bg-green-900/50 dark:border-green-800/80 dark:text-green-200'
    : 'bg-red-100/50 border-red-200/80 text-red-800 dark:bg-red-900/50 dark:border-red-800/80 dark:text-red-200';

  return (
    <div role="alert" className={`flex items-center gap-4 rounded-lg border p-4 ${colorClasses}`}>
      <Icon className="h-6 w-6" />
      <div className="flex-1">
        <p className="font-semibold">{success ? 'Success' : 'Error'}</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
