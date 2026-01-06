import { Download } from 'lucide-react';

interface DownloadLinkProps {
  url: string;
}

export function DownloadLink({ url }: DownloadLinkProps) {
  return (
    <div className="mt-6 p-6 border border-cyan-200/50 dark:border-cyan-800/50 rounded-xl bg-gradient-to-b from-cyan-50/50 to-cyan-100/30 dark:from-cyan-900/20 dark:to-cyan-900/10 backdrop-blur-sm flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
      <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/50 p-3">
        <Download className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
      </div>

      <div className="space-y-1">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          Your audio is ready!
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Click the button below to save your file.
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="group relative flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>Download MP3</span>
        <Download size={18} className="transition-transform group-hover:translate-y-0.5" />
      </a>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-2">Link expires in 1 hour</p>
    </div>
  );
}
