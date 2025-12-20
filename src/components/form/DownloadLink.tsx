import { Download } from 'lucide-react';

interface DownloadLinkProps {
  url: string;
}

export function DownloadLink({ url }: DownloadLinkProps) {
  return (
    <div className="mt-4 p-4 border-2 border-dashed border-green-500 rounded-lg bg-green-50/10 flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        Your audio conversion is complete!
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:scale-105"
      >
        <Download size={20} />
        Click here to Download MP3
      </a>
      <p className="text-[10px] text-gray-400">This link will expire in 1 hour.</p>
    </div>
  );
}
