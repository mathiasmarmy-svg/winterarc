import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BackRow, FieldLabel, TextInput, PrimaryButton } from '../components/UI';

export function CreateGroup({
  onBack,
  onSubmit,
  error,
}: {
  onBack: () => void;
  onSubmit: (groupName: string, name: string, city: string, objectives: string[]) => void;
  error?: string;
}) {
  const [groupName, setGroupName] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [step, setStep] = useState(1);

  const updateObjective = (i: number, v: string) => {
    const copy = [...objectives];
    copy[i] = v;
    setObjectives(copy);
  };
  const addObjective = () => objectives.length < 8 && setObjectives([...objectives, '']);
  const removeObjective = (i: number) => setObjectives(objectives.filter((_, idx) => idx !== i));
  const validObjectives = objectives.map((o) => o.trim()).filter(Boolean);

  return (
    <div>
      <BackRow onBack={onBack} label="Fonder une cellule" />
      {step === 1 && (
        <div>
          <FieldLabel>Nom de la cellule</FieldLabel>
          <TextInput value={groupName} onChange={setGroupName} placeholder="Ex. LES INVAINCUS" autoFocus />
          <div className="h-3.5" />
          <FieldLabel>Ton prénom</FieldLabel>
          <TextInput value={name} onChange={setName} placeholder="Mathias" />
          <div className="h-3.5" />
          <FieldLabel>Ville (optionnel, pour se rencontrer plus tard)</FieldLabel>
          <TextInput value={city} onChange={setCity} placeholder="Morges" />
          <PrimaryButton disabled={!groupName.trim() || !name.trim()} onClick={() => setStep(2)} className="mt-5">
            Continuer
          </PrimaryButton>
        </div>
      )}
      {step === 2 && (
        <div>
          <FieldLabel>Objectifs SMART pour l'hiver</FieldLabel>
          <p className="text-text-low text-[13px] -mt-1.5 mb-3.5">
            Chiffrés, datés. Ex : "50 pompes / jour" plutôt que "faire du sport".
          </p>
          {objectives.map((o, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <TextInput value={o} onChange={(v) => updateObjective(i, v)} placeholder={`Objectif ${i + 1}`} />
              {objectives.length > 1 && (
                <button
                  onClick={() => removeObjective(i)}
                  className="bg-transparent border-none text-text-low p-2 hover:text-ember transition-colors"
                  aria-label="Supprimer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {objectives.length < 8 && (
            <button
              onClick={addObjective}
              className="bg-transparent border border-dashed border-line rounded text-ice text-[13.5px] px-3 py-2 w-full mt-1 flex items-center justify-center gap-1.5 hover:border-ice transition-colors"
            >
              <Plus size={14} /> Ajouter un objectif
            </button>
          )}
          {error && <div className="text-ember text-[13px] mt-2.5">{error}</div>}
          <PrimaryButton
            disabled={validObjectives.length === 0}
            onClick={() => onSubmit(groupName.trim(), name.trim(), city.trim(), validObjectives)}
            className="mt-5"
          >
            Forger la cellule
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
