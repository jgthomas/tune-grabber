'use client';

import { useFormStatus } from 'react-dom';
import { LoaderCircle } from 'lucide-react';

interface SubmitButtonProps {
  pendingText?: string;
  defaultText?: string;
  className?: string;
  disabled?: boolean;
}

export function SubmitButton({
  pendingText = 'Processing...',
  defaultText = 'Submit',
  className = '',
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`flex w-full items-center justify-center rounded-lg px-4 py-3 font-semibold text-white transition-all duration-200 ease-in-out ${
        isDisabled
          ? 'bg-zinc-500 cursor-not-allowed opacity-80'
          : 'bg-cyan-600 hover:bg-cyan-700 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg dark:bg-cyan-600 dark:hover:bg-cyan-500'
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
