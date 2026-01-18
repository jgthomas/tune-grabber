'use client';

import { useRef, useEffect, useActionState, useState, useCallback } from 'react';
import { downloadAction, type DownloadState } from '@/lib/downloaders/youtube/action';
import { getVideoInfoAction, type VideoInfoResult } from '@/lib/downloaders/youtube/info-action';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormAlert } from '@/components/ui/FormAlert';
import { UrlInput } from '@/components/form/UrlInput';
import { DownloadLink } from '@/components/form/DownloadLink';
import { Loader2 } from 'lucide-react';

export default function DownloadForm() {
  const [state, formAction] = useActionState<DownloadState, FormData>(downloadAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [videoInfo, setVideoInfo] = useState<VideoInfoResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
      setVideoInfo(null);
    }
  }, [state]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setVideoInfo(null); // Reset info on change

    if (!url || !url.startsWith('http')) {
      setIsValidating(false);
      return;
    }

    setIsValidating(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const info = await getVideoInfoAction(url);
        setVideoInfo(info);
      } catch (err) {
        console.error(err);
        setVideoInfo({ error: 'Failed to fetch info' });
      } finally {
        setIsValidating(false);
      }
    }, 500); // 500ms debounce
  }, []);

  return (
    <div className="w-full">
      <form ref={formRef} action={formAction} className="flex flex-col gap-5">
        <UrlInput onChange={handleUrlChange} />

        {/* Video Info Display */}
        <div className="min-h-5">
          {isValidating && (
            <div className="flex items-center text-sm text-zinc-500 animate-pulse">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching video info...
            </div>
          )}

          {!isValidating && videoInfo && !videoInfo.error && (
            <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {videoInfo.title || 'Unknown Title'}
              </p>
              {videoInfo.duration && (
                <p className="text-zinc-500 mt-1">
                  Duration: {Math.floor(videoInfo.duration / 60)}:
                  {(videoInfo.duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
          )}

          {!isValidating && videoInfo && videoInfo.error && (
            <p className="text-sm text-red-500">{videoInfo.error}</p>
          )}
        </div>

        <SubmitButton
          pendingText="Processing..."
          defaultText="Download Audio"
          disabled={!videoInfo || !!videoInfo.error || isValidating}
        />

        {state && <FormAlert success={state.success} message={state.message} />}

        {state?.success && state.url && <DownloadLink url={state.url} />}
      </form>
    </div>
  );
}
