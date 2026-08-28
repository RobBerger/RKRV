import Header from '@/components/Header';
import NewParkForm from '@/components/NewParkForm';

export default function NewParkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-gray-900">Add park</h1>
        <NewParkForm />
      </main>
    </>
  );
}
