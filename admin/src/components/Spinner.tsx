export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-4 h-4 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin ${className}`}
    />
  );
}

