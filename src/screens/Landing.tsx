import { Plus, Users, ChevronRight } from 'lucide-react';
import { Wordmark, PrimaryButton, GhostButton } from '../components/UI';

export function Landing({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div>
      <Wordmark />
      <p className="text-text-mid text-[14.5px] leading-relaxed mb-8 mt-5">
        Four or five strangers. One winter. Numbered goals, hit or missed, visible to everyone,
        every day. No feed, no likes: a cell that forges itself — or cracks.
      </p>
      <PrimaryButton onClick={onCreate} row className="mb-3">
        <span className="flex items-center gap-2.5">
          <Plus size={18} /> Found a cell
        </span>
        <ChevronRight size={16} className="opacity-70" />
      </PrimaryButton>
      <GhostButton onClick={onJoin} hoverAccent="#FF5A2B">
        <span className="flex items-center gap-2.5">
          <Users size={18} color="#FF5A2B" /> Join with a code
        </span>
        <ChevronRight size={16} color="#4B525E" />
      </GhostButton>
    </div>
  );
}
