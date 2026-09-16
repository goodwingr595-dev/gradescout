/**
 * Placeholder ad slot. GradeScout doesn't ship with any ad network wired up
 * (that requires your own AdSense/etc. account and publisher IDs), but the
 * layout reserves space here so dropping one in later doesn't reshuffle the
 * page.
 *
 * To wire up Google AdSense once your site is approved:
 * 1. Add the AdSense loader script (with your publisher ID) to
 *    src/app/layout.tsx's <head>.
 * 2. Replace the placeholder <div> below with your <ins class="adsbygoogle">
 *    ad unit snippet from the AdSense dashboard.
 */
export default function AdSlot({ label }: { label: string }) {
  return (
    <div
      className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400"
      aria-hidden="true"
    >
      Ad slot ({label}) — see src/components/AdSlot.tsx
    </div>
  );
}
