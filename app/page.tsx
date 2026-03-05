import "./pai-gow-table.css";

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
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-row mb-2 sm:mb-4">
        <h1 className="text-3xl font-semibold mr-2">{paiGow.title}</h1>
      </div>
      <PaiGowGame />
    </div>
  );
};

export default PaiGowPage;
