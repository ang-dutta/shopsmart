import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p><span className="font-display text-lg text-ink">shop<i className="text-accent">smart</i></span> is an Information Retrieval course project. Inverted index · TF-IDF · BM25 · collaborative filtering.</p>
        <p className="flex gap-4"><Link href="/evaluation" className="hover:text-ink">Evaluation</Link><Link href="/api/search?q=headphones" className="hover:text-ink">API</Link></p>
      </div>
    </footer>
  );
}
