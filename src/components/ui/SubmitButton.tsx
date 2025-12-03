'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  pendingText?: string;
  defaultText?: string;
  className?: string;
}

export function SubmitButton({
  pendingText = 'Processing...',
  defaultText = 'Submit',
  className = '',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
      } text-white ${className}`}
    >
      {pending ? pendingText : defaultText}
    </button>
  );
}
