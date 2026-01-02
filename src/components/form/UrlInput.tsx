import { Link } from 'lucide-react';

interface UrlInputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function UrlInput({
  id = 'url-input',
  name = 'urlInput',
  label = 'YouTube URL',
  placeholder = 'https://youtube.com/watch?v=...',
  required = true,
}: UrlInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Link className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          id={id}
          name={name}
          type="url"
          placeholder={placeholder}
          required={required}
          className="block w-full rounded-md border-zinc-300 bg-zinc-50 py-3 pl-10 pr-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-500"
          pattern="https?://.+"
          title="Please enter a valid URL starting with http:// or https://"
        />
      </div>
    </div>
  );
}
