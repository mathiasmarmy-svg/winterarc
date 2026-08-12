import { useEffect, useState } from 'react';
import { Shell, Seal } from './components/UI';
import { IntroSplash } from './components/IntroSplash';
import { Landing } from './screens/Landing';
import { CreateGroup } from './screens/CreateGroup';
import { JoinGroup } from './screens/JoinGroup';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { fetchGroup, insertGroup, saveGroup, subscribeGroup, findMemberByPseudo } from './lib/store';
import { supabaseConfigured } from './lib/supabase';
import { loadIdentity, saveIdentity } from './lib/identity';
import { makeGroupCode, todayKey, uid } from './lib/utils';
import { hashPassword, generateSalt } from './lib/auth';
import type { Group, Identity, Objective } from './types';

type Phase = 'loading' | 'landing' | 'create' | 'join' | 'login' | 'dashboard' | 'misconfigured';

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [me, setMe] = useState<Identity | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState('');
  // Plays every load, on purpose — no storage gate, so it's never in doubt.
  const [showIntro, setShowIntro] = useState(true);

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

  const handleCreateGroup = async (groupName: string, name: string, city: string, password: string, objectives: string[]) => {
    setError('');
    const taken = await findMemberByPseudo(name).catch(() => null);
    if (taken) {
      setError('That pseudo is already taken. Pick another one.');
      return;
    }
    const code = makeGroupCode();
    const memberId = uid();
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const member = { id: memberId, name, city, checkins: {}, joinedAt: Date.now(), passwordHash, passwordSalt };
    const newGroup: Group = {
      code,
      name: groupName,
      createdAt: Date.now(),
      founderId: memberId,
      objectives: objectives.map((o) => ({ id: uid(), text: o })),
      members: [member],
      messages: [],
    };
    try {
      await insertGroup(newGroup);
    } catch (e) {
      setError('Could not create the cell. Try again in a moment.');
      console.error(e);
      return;
    }
    persistIdentity({ id: memberId, name, groupCode: code });
    setGroup(newGroup);
    setPhase('dashboard');
  };

  const handleJoinGroup = async (code: string, name: string, city: string, password: string) => {
    const upper = code.trim().toUpperCase();
    const g = await fetchGroup(upper).catch(() => null);
    if (!g) {
      setError('That code doesn’t match any cell.');
      return;
    }
    if (g.members.length >= 5) {
      setError('This cell is full (5 members max).');
      return;
    }
    const taken = await findMemberByPseudo(name).catch(() => null);
    if (taken) {
      setError('That pseudo is already taken. Pick another one.');
      return;
    }
    const memberId = uid();
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const member = { id: memberId, name, city, checkins: {}, joinedAt: Date.now(), passwordHash, passwordSalt };
    const updated: Group = { ...g, members: [...g.members, member] };
    try {
      await saveGroup(updated);
    } catch (e) {
      setError('Could not join the cell. Try again in a moment.');
      console.error(e);
      return;
    }
    persistIdentity({ id: memberId, name, groupCode: upper });
    setGroup(updated);
    setPhase('dashboard');
  };

  const handleLogin = async (pseudo: string, password: string) => {
    setError('');
    const found = await findMemberByPseudo(pseudo).catch(() => null);
    if (!found) {
      setError('No account with that pseudo.');
      return;
    }
    const { group: g, member } = found;
    const hash = await hashPassword(password, member.passwordSalt);
    if (hash !== member.passwordHash) {
      setError('Wrong password.');
      return;
    }
    persistIdentity({ id: member.id, name: member.name, groupCode: g.code });
    setGroup(g);
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

  const handleUpdateObjectives = async (objectives: Objective[]) => {
    if (!group) return;
    const updated: Group = { ...group, objectives };
    setGroup(updated);
    await saveGroup(updated).catch((e) => console.error(e));
  };

  const handleLeave = () => {
    saveIdentity(null);
    setMe(null);
    setGroup(null);
    setPhase('landing');
  };

  if (showIntro) {
    return (
      <IntroSplash
        onDone={() => {
          setShowIntro(false);
        }}
      />
    );
  }

  if (phase === 'misconfigured') {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 mb-4">
          <Seal size={20} />
          <span className="font-display text-2xl tracking-wide">WINTER ARC</span>
        </div>
        <div className="border border-line rounded bg-surface p-5 text-[13.5px] text-text-mid leading-relaxed">
          Backend not configured. Set <code className="text-ice font-mono">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-ice font-mono">VITE_SUPABASE_ANON_KEY</code> to enable shared cells.
        </div>
      </Shell>
    );
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 text-text-low">
          <Seal size={18} glow />
          <span>Loading</span>
        </div>
      </Shell>
    );
  }

  if (phase === 'landing') {
    return (
      <Shell>
        <Landing
          onCreate={() => setPhase('create')}
          onJoin={() => setPhase('join')}
          onLogin={() => {
            setError('');
            setPhase('login');
          }}
        />
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

  if (phase === 'login') {
    return (
      <Shell>
        <Login onBack={() => setPhase('landing')} onSubmit={handleLogin} error={error} clearError={() => setError('')} />
      </Shell>
    );
  }

  if (phase === 'dashboard' && group && me) {
    return (
      <Shell wide>
        <Dashboard
          group={group}
          me={me}
          onCheckIn={handleCheckIn}
          onLeave={handleLeave}
          onSendMessage={handleSendMessage}
          onUpdateObjectives={handleUpdateObjectives}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-text-mid">Something went wrong.</div>
    </Shell>
  );
}
