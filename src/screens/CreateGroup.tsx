import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BackRow, FieldLabel, TextInput, PrimaryButton } from '../components/UI';

export function CreateGroup({
  onBack,
  onSubmit,
  error,
}: {
  onBack: () => void;
  onSubmit: (groupName: string, name: string, city: string, password: string, objectives: string[]) => void;
  error?: string;
}) {
  const [groupName, setGroupName] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
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
      <BackRow onBack={onBack} label="Found a cell" />
      {step === 1 && (
        <div>
          <FieldLabel>Cell name</FieldLabel>
          <TextInput value={groupName} onChange={setGroupName} placeholder="E.g. THE UNBROKEN" autoFocus />
          <div className="h-3.5" />
          <FieldLabel>Your name</FieldLabel>
          <TextInput value={name} onChange={setName} placeholder="Mathias" />
          <div className="h-3.5" />
          <FieldLabel>City (optional, to meet up later)</FieldLabel>
          <TextInput value={city} onChange={setCity} placeholder="Morges" />
          <div className="h-3.5" />
          <FieldLabel>Password</FieldLabel>
          <TextInput value={password} onChange={setPassword} placeholder="At least 4 characters" password />
          <p className="text-text-low text-[12px] mt-2">
            Your pseudo + password let you log back in from any device if you lose this one.
          </p>
          <PrimaryButton disabled={!groupName.trim() || !name.trim() || password.length < 4} onClick={() => setStep(2)} className="mt-5">
            Continue
          </PrimaryButton>
        </div>
      )}
      {step === 2 && (
        <div>
          <FieldLabel>SMART goals for the winter</FieldLabel>
          <p className="text-text-low text-[13px] -mt-1.5 mb-3.5">
            Numbered, time-bound. E.g. "50 push-ups / day" rather than "get fit".
          </p>
          {objectives.map((o, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <TextInput value={o} onChange={(v) => updateObjective(i, v)} placeholder={`Goal ${i + 1}`} />
              {objectives.length > 1 && (
                <button
                  onClick={() => removeObjective(i)}
                  className="bg-transparent border-none text-text-low p-2 hover:text-ember transition-colors"
                  aria-label="Remove"
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
              <Plus size={14} /> Add a goal
            </button>
          )}
          {error && <div className="text-ember text-[13px] mt-2.5">{error}</div>}
          <PrimaryButton
            disabled={validObjectives.length === 0}
            onClick={() => onSubmit(groupName.trim(), name.trim(), city.trim(), password, validObjectives)}
            className="mt-5"
          >
            Forge the cell
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
