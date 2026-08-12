import { useState } from 'react';
import { BackRow, FieldLabel, TextInput, PrimaryButton } from '../components/UI';

export function Login({
  onBack,
  onSubmit,
  error,
  clearError,
}: {
  onBack: () => void;
  onSubmit: (pseudo: string, password: string) => void;
  error: string;
  clearError: () => void;
}) {
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <BackRow onBack={onBack} label="Log in" />
      <p className="text-text-mid text-[13.5px] leading-relaxed mb-5">
        Lost access to this device? Log back in with the pseudo and password you set when you joined or founded your cell.
      </p>
      <FieldLabel>Pseudo</FieldLabel>
      <TextInput
        value={pseudo}
        onChange={(v) => {
          setPseudo(v);
          clearError();
        }}
        placeholder="Mathias"
        autoFocus
      />
      <div className="h-3.5" />
      <FieldLabel>Password</FieldLabel>
      <TextInput
        value={password}
        onChange={(v) => {
          setPassword(v);
          clearError();
        }}
        placeholder="••••••••"
        password
      />
      {error && <div className="text-ember text-[13px] mt-2.5">{error}</div>}
      <PrimaryButton disabled={!pseudo.trim() || !password} onClick={() => onSubmit(pseudo.trim(), password)} className="mt-5">
        Log in
      </PrimaryButton>
    </div>
  );
}
