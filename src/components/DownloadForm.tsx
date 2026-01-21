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
  const [isPolling, setIsPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout>(null);
  const pollTimer = useRef<NodeJS.Timeout>(null);

  // Handle Action State Changes
  useEffect(() => {
    if (state?.success) {
      // Sync Mode or Async Mode started
      if (state.jobId) {
        // Start Polling
        setIsPolling(true);
        setPollStatus('Job submitted. Waiting for processor...');
        setDownloadUrl(null);
      } else if (state.url) {
        // Direct Sync Success (Fallback)
        setDownloadUrl(state.url);
        formRef.current?.reset();
        setVideoInfo(null);
      }
    } else if (state?.success === false) {
      // Error
      setIsPolling(false);
      setPollStatus('');
    }
  }, [state]);

  // Polling Logic
  useEffect(() => {
    if (!isPolling || !state?.jobId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status?jobId=${state.jobId}`);
        const data = await res.json();

        if (data.success) {
          if (data.status === 'COMPLETED') {
            setIsPolling(false);
            setPollStatus('Complete!');
            setDownloadUrl(data.downloadUrl);
            formRef.current?.reset();
            setVideoInfo(null);
          } else if (data.status === 'FAILED') {
            setIsPolling(false);
            setPollStatus(`Failed: ${data.error || 'Unknown error'}`);
          } else {
            setPollStatus(`Status: ${data.status}...`);
          }
        } else {
          // API Error?
          console.warn('Status check failed:', data.message);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    pollTimer.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [isPolling, state?.jobId]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setVideoInfo(null); // Reset info on change
    setDownloadUrl(null); // Reset previous download

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
        <input type="hidden" name="title" value={videoInfo?.title || ''} />

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
          pendingText="Submitting..."
          defaultText={isPolling ? 'Processing Job...' : 'Download Audio'}
          disabled={!videoInfo || !!videoInfo.error || isValidating || isPolling}
        />

        {/* Status / Alert Area */}
        {state && !isPolling && !downloadUrl && (
          <FormAlert success={state.success} message={state.message} />
        )}

        {isPolling && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">{pollStatus}</span>
          </div>
        )}

        {/* Final Download Link */}
        {downloadUrl && <DownloadLink url={downloadUrl} />}
      </form>
    </div>
  );
}
