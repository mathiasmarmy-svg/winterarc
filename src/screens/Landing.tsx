import { Plus, Users, ChevronRight } from 'lucide-react';
import { Wordmark, PrimaryButton, GhostButton } from '../components/UI';

export function Landing({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div>
      <Wordmark />
      <p className="text-text-mid text-[14.5px] leading-relaxed mb-8 mt-5">
        Quatre ou cinq inconnus. Un hiver. Des objectifs chiffrés tenus ou non, visibles de tous,
        chaque jour. Pas de flux, pas de likes : une cellule qui se construit, ou qui craque.
      </p>
      <PrimaryButton onClick={onCreate} row className="mb-3">
        <span className="flex items-center gap-2.5">
          <Plus size={18} /> Fonder une cellule
        </span>
        <ChevronRight size={16} className="opacity-70" />
      </PrimaryButton>
      <GhostButton onClick={onJoin} hoverAccent="#FF5A2B">
        <span className="flex items-center gap-2.5">
          <Users size={18} color="#FF5A2B" /> Rejoindre avec un code
        </span>
        <ChevronRight size={16} color="#4B525E" />
      </GhostButton>
    </div>
  );
}
