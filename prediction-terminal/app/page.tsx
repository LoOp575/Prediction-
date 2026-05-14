
import { analyzeHK } from "@/lib/analyze";

export default function Home() {
  const analysis = analyzeHK();

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <h1 className="text-2xl font-bold mb-4">
        Prediction Intelligence Terminal
      </h1>

      <p>Market: {analysis.market}</p>
      <p>Total Draws: {analysis.totalDraws}</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Top Predictions</h2>

      {analysis.predictions.map((item) => (
        <div key={item.number}>
          {item.number} — {(item.probability * 100).toFixed(4)}%
        </div>
      ))}
    </main>
  );
}
