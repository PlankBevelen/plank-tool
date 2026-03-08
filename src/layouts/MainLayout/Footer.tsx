

export default function Footer() {
  return (
    <footer className="flex-shrink-0 border-t border-zinc-200 bg-white px-6 py-3 flex items-center justify-center">
      <span className="text-xs text-zinc-400">
        Plank工盒 © {new Date().getFullYear()} · 简约 · 实用 · 高效
      </span>
    </footer>
  )
}