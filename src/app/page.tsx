import DownloadForm from '@/components/DownloadForm';

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl bg-white px-16 py-32 dark:bg-zinc-900">
        <DownloadForm />
      </main>
    </div>
  );
}
