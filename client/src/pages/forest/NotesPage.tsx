/**
 * UNICORN FOREST — Field Notes page
 * The cartographer's vault: S3-backed expedition notes.
 */
import FieldNotes from "@/components/FieldNotes";
import { useGame } from "@/contexts/GameContext";
import { DocPage } from "@/components/templates/PageTemplates";

export default function NotesPage() {
  const { state } = useGame();
  return (
    <DocPage
      title="📜 FIELD NOTES"
      subtitle="the cartographer's vault · observations pinned to awakened centres"
      accent="amber"
    >
      <FieldNotes discovered={state.discovered} />
    </DocPage>
  );
}
