import { useState } from 'react';
import { BackRow, FieldLabel, TextInput, PrimaryButton } from '../components/UI';

export function JoinGroup({
  onBack,
  onSubmit,
  error,
  clearError,
}: {
  onBack: () => void;
  onSubmit: (code: string, name: string, city: string) => void;
  error: string;
  clearError: () => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  return (
    <div>
      <BackRow onBack={onBack} label="Join a cell" />
      <FieldLabel>Cell code</FieldLabel>
      <TextInput
        value={code}
        onChange={(v) => {
          setCode(v.toUpperCase());
          clearError();
        }}
        placeholder="E.G. 7F2KQZ"
        mono
        autoFocus
      />
      <div className="h-3.5" />
      <FieldLabel>Your name</FieldLabel>
      <TextInput value={name} onChange={setName} placeholder="Mathias" />
      <div className="h-3.5" />
      <FieldLabel>City (optional)</FieldLabel>
      <TextInput value={city} onChange={setCity} placeholder="Morges" />
      {error && <div className="text-ember text-[13px] mt-2.5">{error}</div>}
      <PrimaryButton disabled={!code.trim() || !name.trim()} onClick={() => onSubmit(code, name.trim(), city.trim())} className="mt-5">
        Join
      </PrimaryButton>
    </div>
  );
}
