'use client';
import { useCallback, useState } from 'react';
import ProductCard from './ProductCard';
import QuickView from './QuickView';

// items: [{product, titleSegs?, snippetSegs?, score?, badge?}]. `rail` = horizontally scrolling carousel.
export default function ProductGrid({ items, showScores = false, rail = false, className = '' }) {
  const [quick, setQuick] = useState(null);
  const close = useCallback(() => setQuick(null), []);
  const layout = rail
    ? 'scroll-hide -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8'
    : 'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 ' + className;
  return (
    <>
      <div className={layout}>
        {items.map((it, i) => (
          <div key={it.product.id} className={`fade-up ${rail ? 'w-[210px] shrink-0 snap-start sm:w-[250px]' : ''} flex`} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
            <ProductCard item={it} showScore={showScores} onQuick={setQuick} className="w-full" />
          </div>
        ))}
      </div>
      {quick && <QuickView item={quick} onClose={close} />}
    </>
  );
}
