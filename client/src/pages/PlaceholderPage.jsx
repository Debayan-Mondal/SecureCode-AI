import { Construction } from "lucide-react";

function PlaceholderPage({ title, description }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <Construction size={32} className="text-emerald-400" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-white">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-sm text-zinc-500">
        {description}
      </p>

      <span className="mt-6 rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-500">
        Under development
      </span>
    </div>
  );
}

export default PlaceholderPage;