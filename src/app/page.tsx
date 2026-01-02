import DownloadForm from '@/components/DownloadForm';

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="w-full max-w-lg bg-white p-8 dark:bg-zinc-900/50">
        <div className="flex flex-col items-center justify-center space-y-6 pt-24">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
            Tune Grabber
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Enter a YouTube URL to download the audio from the video.
          </p>
        </div>
        <DownloadForm />
      </main>
    </div>
  );
}
