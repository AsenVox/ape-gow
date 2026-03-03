import { paiGow } from "@/components/pai-gow/paiGowConfig";
import PaiGowGame from "@/components/pai-gow/PaiGowGame";

export async function generateMetadata() {
  return {
    title: paiGow.title,
    description: paiGow.description,
  };
}

const PaiGowPage: React.FC = () => {
  return (
    <div className="w-full">
      {/* Full-bleed: the Pai Gow table manages its own layout. */}
      <PaiGowGame game={paiGow} />
    </div>
  );
};

export default PaiGowPage;