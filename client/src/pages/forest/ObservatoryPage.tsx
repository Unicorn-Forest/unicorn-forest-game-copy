/**
 * UNICORN FOREST — KSM Observatory page
 * The self-ontogenetic instrument panel: cycle wheel, living centres,
 * evolution ledger, system ladder, council of wizards.
 */
import KsmObservatory from "@/components/KsmObservatory";
import { useGame } from "@/contexts/GameContext";

export default function ObservatoryPage() {
  const { expeditionId, statusOf, wholeness, state } = useGame();
  return (
    <div className="max-w-[1400px] mx-auto">
      <KsmObservatory
        expeditionId={expeditionId}
        statusOf={statusOf}
        wholeness={wholeness}
        cycles={state.cycles}
      />
    </div>
  );
}
