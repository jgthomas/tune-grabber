import { Download } from 'lucide-react';

interface DownloadLinkProps {
  url: string;
}

export function DownloadLink({ url }: DownloadLinkProps) {
  return (
    <div className="mt-4 p-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50/20 dark:bg-green-900/20 flex flex-col items-center gap-4 text-center">
      <p className="text-base font-medium text-green-700 dark:text-green-300">
        Your audio is ready!
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-semibold transition-transform duration-300 ease-in-out hover:scale-105"
      >
        <Download size={22} />
        Download MP3
      </a>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">This link will expire in 1 hour.</p>
    </div>
  );
}
