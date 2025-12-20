'use client';

import { useRef, useEffect, useActionState } from 'react';
import { downloadAction, type DownloadState } from '@/lib/downloaders/youtube/action';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormAlert } from '@/components/ui/FormAlert';
import { UrlInput } from '@/components/form/UrlInput';
import { DownloadLink } from '@/components/form/DownloadLink';

export default function DownloadForm() {
  const [state, formAction] = useActionState<DownloadState, FormData>(downloadAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <UrlInput />

        <SubmitButton pendingText="Processing..." defaultText="Download Audio" />

        {state && <FormAlert success={state.success} message={state.message} />}

        {state?.success && state.url && <DownloadLink url={state.url} />}
      </form>
    </div>
  );
}
