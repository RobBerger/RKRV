import Header from '@/components/Header';
import ParkDetail from '@/components/ParkDetail';

export default async function ParkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <ParkDetail parkId={id} />
      </main>
    </>
  );
}
