import { PredictionMarketsList } from '../../../components/PredictionMarketsList';
import { PredictionHistory, PredictorLeaderboard } from '../../../components/PredictionHistoryAndLeaderboard';
import { PredictorBalanceHeader } from '../../../components/PredictorBalanceHeader';

export default function PredictionsPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Predictions</h1>
          <p className="mt-0.5 text-sm text-white/50">
            Back the artists, genres, and countries you think will break out next, using $AMPS. Fictional points
            only — demo predictions resolve instantly against each market&apos;s odds, never real money.
          </p>
        </div>

        <PredictorBalanceHeader />

        <PredictionMarketsList />

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Top predictors</h2>
        </div>
        <PredictorLeaderboard />
      </div>

      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Your predictions</h2>
        <PredictionHistory />
      </div>
    </div>
  );
}
