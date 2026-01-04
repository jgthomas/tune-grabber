import DownloadForm from '@/components/DownloadForm';

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center items-center p-4 sm:p-8 md:items-start md:pt-32">
      <main className="w-full max-w-lg relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 px-8 py-12 shadow-xl backdrop-blur-xl transition-all hover:shadow-2xl dark:border-white/10 dark:bg-zinc-900/60 sm:px-12 md:max-w-2xl md:px-16 md:py-16">
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/10" />

        <div className="relative flex flex-col items-center justify-center space-y-6 text-center">
          <h1 className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:to-violet-400 md:text-6xl">
            Tune Grabber
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-sm leading-relaxed md:max-w-lg md:text-xl">
            Convert your favorite YouTube videos to high-quality MP3 audio in seconds.
          </p>
        </div>

        <div className="relative mt-10">
          <DownloadForm />
        </div>
      </main>
    </div>
  );
}
