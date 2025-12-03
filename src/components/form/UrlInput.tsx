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
    <div>
      <label htmlFor={id} className="block text-xl font-semibold mb-2 text-center">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="url"
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        pattern="https?://.+"
        title="Please enter a valid URL starting with http:// or https://"
      />
    </div>
  );
}
