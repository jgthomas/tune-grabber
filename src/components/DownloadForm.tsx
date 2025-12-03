'use client';

import { useRef, useEffect } from 'react';
import { downloadAction, type DownloadState } from '@/lib/downloaders/youtube/action';
import { useFormStatus, useFormState } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
      } text-white`}
    >
      {pending ? 'Processing...' : 'Download Audio'}
    </button>
  );
}

export default function DownloadForm() {
  const [state, formAction] = useFormState<DownloadState, FormData>(downloadAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form ref={formRef} action={formAction} className="flex flex-direction-column gap-4">
        <div>
          <label htmlFor="url-input" className="block text-sm font-medium mb-2">
            YouTube URL
          </label>
          <input
            id="url-input"
            name="urlInput"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            pattern="https?://.+"
            title="Please enter a valid URL starting with http:// or https://"
          />
        </div>

        <SubmitButton />

        {state && (
          <div
            role="alert"
            className={`p-4 rounded border ${
              state.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <p className="font-medium">{state.success ? '✅ Success' : '❌ Error'}</p>
            <p className="text-sm mt-1">{state.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
