export default function Loading() {
  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
      <div className="skeleton hidden h-[32rem] lg:block" />
      <div><div className="skeleton mb-6 h-10 w-2/3" /><div className="grid grid-cols-2 gap-5 md:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <div key={i} className="skeleton h-80" />)}</div></div>
    </div>
  );
}
