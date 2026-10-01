import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData } from '@/lib/data';
import { similarTo, alsoBoughtFor } from '@/lib/reco/recommend';
import ProductImage from '@/components/ProductImage';
import Stars from '@/components/Stars';
import AddToCart from '@/components/AddToCart';
import ProductGrid from '@/components/ProductGrid';
import Recommended from '@/components/Recommended';
import ViewTracker from '@/components/ViewTracker';
import { money } from '@/lib/format';

export async function generateMetadata({ params }) {
  const { id } = await params, d = getData(), pos = d.idToPos.get(id);
  return { title: pos === undefined ? 'Not found' : d.products[pos].title };
}

export default async function ProductPage({ params }) {
  const { id } = await params, data = getData(), pos = data.idToPos.get(id);
  if (pos === undefined) notFound();
  const p = data.products[pos], similar = similarTo(data, id, 8), also = alsoBoughtFor(data, id, 8);
  const crumb = (href, label) => <Link href={href} className="hover:text-ink hover:underline underline-offset-4">{label}</Link>;
  return (
    <article className="py-8 sm:py-10">
      <ViewTracker id={id} />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted" aria-label="Breadcrumb">
        {crumb('/', 'Home')} <span>/</span> {crumb(`/search?category=${encodeURIComponent(p.category)}`, p.category)} <span>/</span> {crumb(`/search?q=${encodeURIComponent(p.subcategory)}`, p.subcategory)}
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="fade-up aspect-square overflow-hidden rounded-[2rem] border border-line bg-paper shadow-soft"><ProductImage src={p.image} alt={p.title} /></div>
        <div className="flex flex-col gap-4 md:py-4">
          <Link href={`/search?brand=${encodeURIComponent(p.brand)}`} className="w-fit text-xs font-bold uppercase tracking-[.16em] text-muted hover:text-accent">{p.brand}</Link>
          <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">{p.title}</h1>
          <Stars rating={p.rating} count={p.reviews} size={17} />
          <p className="text-3xl font-bold tracking-tight">{money(p.price)}</p>
          <p className="max-w-prose leading-relaxed text-muted">{p.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[['Category', p.category], ['Type', p.subcategory], ['Brand', p.brand], ['SKU', p.id]].map(([k, v]) => <div key={k} className="rounded-2xl border border-line bg-white px-4 py-3"><dt className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
          <div className="mt-2"><AddToCart id={p.id} className="w-full sm:w-auto" /></div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><h2 className="font-display text-3xl sm:text-4xl">Similar products</h2><p className="text-sm text-muted">Content-based · TF-IDF cosine similarity between product texts</p></div>
        <ProductGrid items={similar} rail />
      </section>
      {also.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><h2 className="font-display text-3xl sm:text-4xl">Customers also bought</h2><p className="text-sm text-muted">Collaborative · item-item similarity from purchases, carts and views</p></div>
          <ProductGrid items={also} rail />
        </section>
      )}
      <Recommended exclude={id} />
    </article>
  );
}
