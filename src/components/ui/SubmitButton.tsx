'use client';

import { useFormStatus } from 'react-dom';
import { LoaderCircle } from 'lucide-react';

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
      className={`flex w-full items-center justify-center rounded-md px-4 py-3 font-semibold text-white transition-colors ${
        pending
          ? 'bg-zinc-500 cursor-not-allowed'
          : 'bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-800'
      } ${className}`}
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          {pendingText}
        </>
      ) : (
        defaultText
      )}
    </button>
  );
}
