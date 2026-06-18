import { StratumMap } from "@/components/StratumMap";

export default function PublicMapPage() {
  return (
    <main className="h-screen bg-night">
      <StratumMap mode="public" className="h-screen min-h-screen" />
    </main>
  );
}
