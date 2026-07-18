/**
 * UNICORN FOREST — Music Shrine page
 * The memorial music player, full-width frame.
 */
import MusicShrine from "@/components/MusicShrine";
import { useGame } from "@/contexts/GameContext";
import { DocPage } from "@/components/templates/PageTemplates";

export default function ShrinePage() {
  const { started } = useGame();
  return (
    <DocPage
      title="🎵 MUSIC SHRINE"
      subtitle="songs kept burning for Kayla · plays once on entering the forest"
      accent="violet"
    >
      <MusicShrine started={started} />
    </DocPage>
  );
}
