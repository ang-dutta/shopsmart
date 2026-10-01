import CartView from '@/components/CartView';

export const metadata = { title: 'Your cart' };

export default function CartPage() {
  return <div className="py-8 sm:py-12"><CartView /></div>;
}
