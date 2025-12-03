interface FormAlertProps {
  success: boolean;
  message: string;
}

export function FormAlert({ success, message }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={`p-4 rounded border ${
        success
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <p className="font-medium">{success ? '✅ Success' : '❌ Error'}</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}
