import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-center">
      <div><p className="font-display text-7xl text-accent">404</p><h1 className="mt-2 font-display text-3xl">We couldn’t find that page.</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-accent">Back to the shop</Link></div>
    </div>
  );
}
