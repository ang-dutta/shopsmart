import Link from 'next/link';
import SearchBox from '@/components/SearchBox';
import ProductGrid from '@/components/ProductGrid';
import Recommended from '@/components/Recommended';
import { getData } from '@/lib/data';
import { trending } from '@/lib/reco/recommend';
import { categoryStyle } from '@/lib/format';
import { ArrowIcon } from '@/components/Icons';

export const dynamic = 'force-static';

const TRY = ['wireles headphones', 'couch', 'waterproof running shoes', 'tv', 'gel moisturizer', 'ergonomic office chair'];

export default function Home() {
  const data = getData(), { meta } = data;
  const items = trending(data, { k: 10 });
  return (
    <>
      <section className="relative pb-14 pt-14 text-center sm:pt-24">
        <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-[radial-gradient(closest-side,rgb(243_198_79/.35),transparent)] blur-2xl" />
        <p className="fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-forest">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Search that understands what you meant
        </p>
        <h1 className="fade-up mx-auto max-w-4xl font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl" style={{ animationDelay: '60ms' }}>
          Find the thing you <span className="italic text-accent">actually</span> had in mind.
        </h1>
        <div className="fade-up mx-auto mt-10 max-w-2xl text-left" style={{ animationDelay: '120ms' }}><SearchBox variant="hero" /></div>
        <div className="fade-up mt-5 flex flex-wrap items-center justify-center gap-2 text-sm" style={{ animationDelay: '180ms' }}>
          <span className="text-muted">Try</span>
          {TRY.map((t) => <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold transition hover:border-ink hover:bg-ink hover:text-white">{t}</Link>)}
        </div>
        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          {[[meta.products.toLocaleString(), 'products indexed'], [meta.terms.toLocaleString(), 'unique stems'], [meta.users.toLocaleString(), 'shopper profiles'], ['2', 'ranking models']].map(([v, l]) => (
            <div key={l}><dt className="font-display text-4xl">{v}</dt><dd className="text-xs font-semibold uppercase tracking-[.14em] text-muted">{l}</dd></div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between"><h2 className="font-display text-3xl sm:text-4xl">Shop by category</h2></div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {Object.entries(meta.categories).map(([name, n], i) => {
            const [emoji, hue] = categoryStyle(name);
            return (
              <Link key={name} href={`/search?category=${encodeURIComponent(name)}`} className={`group relative overflow-hidden rounded-card border border-line p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift ${i === 0 ? 'col-span-2' : ''}`}
                style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 96%), hsl(${(hue + 28) % 360} 62% 88%))` }}>
                <span className="absolute -bottom-3 -right-1 text-7xl opacity-90 transition duration-500 group-hover:-rotate-6 group-hover:scale-110">{emoji}</span>
                <p className="font-display text-2xl leading-tight">{name}</p><p className="mt-1 text-xs font-semibold text-muted">{n.toLocaleString()} products</p>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-bold">Browse <ArrowIcon width={14} height={14} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-5 font-display text-3xl sm:text-4xl">Trending now</h2>
        <ProductGrid items={items} rail />
      </section>

      <Recommended />

      <section className="mt-20 grid gap-4 rounded-[2rem] bg-forest p-6 text-white sm:p-10 md:grid-cols-3">
        <div className="md:col-span-3"><h2 className="font-display text-3xl sm:text-4xl">Under the hood</h2><p className="mt-2 max-w-2xl text-white/70">Everything is written from scratch in JavaScript, with no search engine and no vector database.</p></div>
        {[['Inverted index', 'Stemmed terms map to posting lists, built offline and saved as JSON. Queries only touch the postings of their own terms.'],
          ['TF-IDF vs BM25', 'Flip the ranking model on any results page, then compare precision, recall, MAP, MRR and nDCG on the evaluation page.'],
          ['Two recommenders', 'Content-based similarity from TF-IDF vectors plus item-item collaborative filtering over 65k synthetic interactions.']].map(([t, d]) => (
          <div key={t} className="rounded-2xl bg-white/[.07] p-5"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p></div>
        ))}
        <Link href="/evaluation" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-forest transition hover:bg-sun md:col-span-3">See the evaluation <ArrowIcon width={16} height={16} /></Link>
      </section>
    </>
  );
}
