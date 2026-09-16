import Disclaimer from "@/components/Disclaimer";
import AdSlot from "@/components/AdSlot";
import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-ink">GradeScout</h1>
        <p className="mt-2 text-gray-600">
          Upload a couple of photos of your trading card for a free, rough pre-grading estimate.
        </p>
      </header>

      <div className="mb-6">
        <AdSlot label="top" />
      </div>

      <div className="mb-6">
        <Disclaimer />
      </div>

      <UploadForm />

      <div className="my-6">
        <AdSlot label="bottom" />
      </div>

      <footer className="mt-10 text-center text-xs text-gray-400">
        <p>
          GradeScout is free and{" "}
          <a
            href="https://github.com/"
            className="underline hover:text-gray-600"
            target="_blank"
            rel="noreferrer"
          >
            open source
          </a>
          . Not affiliated with PSA, CGC, or BGS.
        </p>
      </footer>
    </main>
  );
}
