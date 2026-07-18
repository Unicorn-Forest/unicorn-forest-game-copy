/**
 * UNICORN FOREST — Ask the Oracle page
 * Live Chatbase channel + AtomSpace skeleton navigation.
 */
import AskOracle from "@/components/AskOracle";
import { DocPage } from "@/components/templates/PageTemplates";

export default function OraclePage() {
  return (
    <DocPage
      title="ASK THE ORACLE"
      subtitle="a live channel to the unicorn oracle · numbered paths follow the AtomSpace skeleton"
      accent="cyan"
    >
      <AskOracle />
    </DocPage>
  );
}
