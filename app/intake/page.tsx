import IntakeForm from "@/components/IntakeForm";
import DeadlineBanner from "@/components/DeadlineBanner";

export default function IntakePage() {
  return (
    <main className="min-h-screen">
      <DeadlineBanner />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif mb-2">5 questions. 60 seconds.</h1>
        <p className="text-ink/60 mb-8">
          We'll match your business against 300+ federal, state, and local tax
          credits.
        </p>
        <IntakeForm />
      </div>
    </main>
  );
}
