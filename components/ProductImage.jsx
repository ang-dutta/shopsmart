/* eslint-disable @next/next/no-img-element */
export default function ProductImage({ src, alt, className = '' }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
}
