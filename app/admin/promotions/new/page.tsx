import PromotionForm from '@/app/admin/promotions/components/PromotionForm';

export default function NewPromotionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">New Promotion</h1>
        <p className="mt-1 text-sm text-gray-600">Create a sale for selected pawshop products.</p>
      </div>
      <PromotionForm />
    </div>
  );
}
