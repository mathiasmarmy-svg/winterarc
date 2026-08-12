import { useEffect, useState } from 'react';
import { Shell, Seal } from './components/UI';
import { Landing } from './screens/Landing';
import { CreateGroup } from './screens/CreateGroup';
import { JoinGroup } from './screens/JoinGroup';
import { Dashboard } from './screens/Dashboard';
import { fetchGroup, insertGroup, saveGroup, subscribeGroup } from './lib/store';
import { supabaseConfigured } from './lib/supabase';
import { loadIdentity, saveIdentity } from './lib/identity';
import { makeGroupCode, todayKey, uid } from './lib/utils';
import type { Group, Identity } from './types';

type Phase = 'loading' | 'landing' | 'create' | 'join' | 'dashboard' | 'misconfigured';

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [me, setMe] = useState<Identity | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) {
      setPhase('misconfigured');
      return;
    }
    (async () => {
      const local = loadIdentity();
      if (local) {
        setMe(local);
        const g = await fetchGroup(local.groupCode).catch(() => null);
        if (g) {
          setGroup(g);
          setPhase('dashboard');
          return;
        }
      }
      setPhase('landing');
    })();
  }, []);

  useEffect(() => {
    if (!group || phase !== 'dashboard') return;
    const unsubscribe = subscribeGroup(group.code, setGroup);
    const interval = setInterval(() => {
      fetchGroup(group.code).then((g) => g && setGroup(g)).catch(() => {});
    }, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.code, phase]);

  const persistIdentity = (identity: Identity) => {
    setMe(identity);
    saveIdentity(identity);
  };

  const handleCreateGroup = async (groupName: string, name: string, city: string, objectives: string[]) => {
    setError('');
    const code = makeGroupCode();
    const memberId = uid();
    const member = { id: memberId, name, city, checkins: {}, joinedAt: Date.now() };
    const newGroup: Group = {
      code,
      name: groupName,
      createdAt: Date.now(),
      objectives: objectives.map((o) => ({ id: uid(), text: o })),
      members: [member],
      messages: [],
    };
    try {
      await insertGroup(newGroup);
    } catch (e) {
      setError("Impossible de créer la cellule. Réessaie dans un instant.");
      console.error(e);
      return;
    }
    persistIdentity({ id: memberId, name, groupCode: code });
    setGroup(newGroup);
    setPhase('dashboard');
  };

  const handleJoinGroup = async (code: string, name: string, city: string) => {
    const upper = code.trim().toUpperCase();
    const g = await fetchGroup(upper).catch(() => null);
    if (!g) {
      setError('Ce code ne correspond à aucun groupe.');
      return;
    }
    if (g.members.length >= 5) {
      setError('Ce groupe est complet (5 membres max).');
      return;
    }
    const memberId = uid();
    const member = { id: memberId, name, city, checkins: {}, joinedAt: Date.now() };
    const updated: Group = { ...g, members: [...g.members, member] };
    try {
      await saveGroup(updated);
    } catch (e) {
      setError("Impossible de rejoindre la cellule. Réessaie dans un instant.");
      console.error(e);
      return;
    }
    persistIdentity({ id: memberId, name, groupCode: upper });
    setGroup(updated);
    setPhase('dashboard');
  };

  const handleCheckIn = async (objectiveId: string) => {
    if (!group || !me) return;
    const key = todayKey();
    const updated: Group = {
      ...group,
      members: group.members.map((m) => {
        if (m.id !== me.id) return m;
        const current = m.checkins[key] || [];
        const next = current.includes(objectiveId)
          ? current.filter((o) => o !== objectiveId)
          : [...current, objectiveId];
        return { ...m, checkins: { ...m.checkins, [key]: next } };
      }),
    };
    setGroup(updated);
    await saveGroup(updated).catch((e) => console.error(e));
  };

  const handleSendMessage = async (text: string) => {
    if (!group || !me || !text.trim()) return;
    const updated: Group = {
      ...group,
      messages: [
        ...(group.messages || []),
        { id: uid(), authorId: me.id, authorName: me.name, text: text.trim(), at: Date.now() },
      ],
    };
    setGroup(updated);
    await saveGroup(updated).catch((e) => console.error(e));
  };

  const handleLeave = () => {
    saveIdentity(null);
    setMe(null);
    setGroup(null);
    setPhase('landing');
  };

  if (phase === 'misconfigured') {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 mb-4">
          <Seal size={20} />
          <span className="font-display text-2xl tracking-wide">WINTER ARC</span>
        </div>
        <div className="border border-line rounded bg-surface p-5 text-[13.5px] text-text-mid leading-relaxed">
          Backend non configuré. Renseigne <code className="text-ice font-mono">VITE_SUPABASE_URL</code> et{' '}
          <code className="text-ice font-mono">VITE_SUPABASE_ANON_KEY</code> pour activer les cellules partagées.
        </div>
      </Shell>
    );
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 text-text-low">
          <Seal size={18} glow />
          <span>Chargement</span>
        </div>
      </Shell>
    );
  }

  if (phase === 'landing') {
    return (
      <Shell>
        <Landing onCreate={() => setPhase('create')} onJoin={() => setPhase('join')} />
      </Shell>
    );
  }

  if (phase === 'create') {
    return (
      <Shell>
        <CreateGroup
          onBack={() => {
            setError('');
            setPhase('landing');
          }}
          onSubmit={handleCreateGroup}
          error={error}
        />
      </Shell>
    );
  }

  if (phase === 'join') {
    return (
      <Shell>
        <JoinGroup onBack={() => setPhase('landing')} onSubmit={handleJoinGroup} error={error} clearError={() => setError('')} />
      </Shell>
    );
  }

  if (phase === 'dashboard' && group && me) {
    return (
      <Shell wide>
        <Dashboard group={group} me={me} onCheckIn={handleCheckIn} onLeave={handleLeave} onSendMessage={handleSendMessage} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-text-mid">Une erreur est survenue.</div>
    </Shell>
  );
}
