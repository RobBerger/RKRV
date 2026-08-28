import Header from '@/components/Header';
import ParksTable from '@/components/ParksTable';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <ParksTable />
      </main>
    </>
  );
}
