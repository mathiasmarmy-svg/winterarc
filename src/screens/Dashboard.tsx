import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Users,
  Check,
  Target,
  Copy,
  LogOut,
  MessageCircle,
  BarChart3,
  MapPin,
  Send,
} from 'lucide-react';
import { Wordmark, Avatar, RankBadge, Progress } from '../components/UI';
import { formatDay, todayKey } from '../lib/utils';
import type { Group, Identity, Member } from '../types';

interface DashboardProps {
  group: Group;
  me: Identity;
  onCheckIn: (objectiveId: string) => void;
  onLeave: () => void;
  onSendMessage: (text: string) => void;
}

const TABS = [
  { key: 'today', label: 'Aujourd’hui', icon: Target },
  { key: 'group', label: 'Cellule', icon: Users },
  { key: 'chat', label: 'Discussion', icon: MessageCircle },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function Dashboard({ group, me, onCheckIn, onLeave, onSendMessage }: DashboardProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabKey>('today');
  const today = todayKey();
  const meMember = group.members.find((m) => m.id === me.id);

  const streakFor = (member: Member) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = formatDay(d);
      const done = member.checkins[key];
      if (done && done.length === group.objectives.length && group.objectives.length > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };
  const pctFor = (member: Member) => {
    const days = Object.keys(member.checkins).length;
    if (days === 0 || group.objectives.length === 0) return 0;
    const totalPossible = days * group.objectives.length;
    const totalDone = Object.values(member.checkins).reduce((acc, arr) => acc + arr.length, 0);
    return Math.round((totalDone / totalPossible) * 100);
  };
  const copyCode = () => {
    navigator.clipboard?.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-1.5 flex-wrap gap-3">
        <Wordmark subtitle={group.name} />
        <div className="flex gap-2 items-center">
          <button
            onClick={copyCode}
            className="bg-surface border border-line rounded text-text-mid text-[12.5px] px-3 py-2 flex items-center gap-1.5 font-mono hover:border-ice transition-colors"
          >
            <Copy size={12} /> {copied ? 'Copié !' : group.code}
          </button>
          <button
            onClick={onLeave}
            className="bg-transparent border-none text-text-low p-2 hover:text-ember transition-colors"
            aria-label="Quitter"
            title="Quitter (sur cet appareil)"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 my-5 border-b border-line overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`bg-transparent border-none px-3.5 py-2.5 flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors -mb-px ${
                active ? 'text-text-hi border-b-2 border-ice' : 'text-text-low border-b-2 border-transparent hover:text-text-mid'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'today' && <TodayTab group={group} meMember={meMember} today={today} onCheckIn={onCheckIn} />}
      {tab === 'group' && <GroupTab group={group} me={me} pctFor={pctFor} streakFor={streakFor} today={today} />}
      {tab === 'chat' && <ChatTab group={group} me={me} onSendMessage={onSendMessage} />}
      {tab === 'stats' && <StatsTab group={group} me={me} pctFor={pctFor} />}
    </div>
  );
}

function TodayTab({
  group,
  meMember,
  today,
  onCheckIn,
}: {
  group: Group;
  meMember?: Member;
  today: string;
  onCheckIn: (objectiveId: string) => void;
}) {
  const doneToday = meMember?.checkins[today]?.length ?? 0;
  const allDone = group.objectives.length > 0 && doneToday === group.objectives.length;

  return (
    <div className="relative border border-line rounded bg-surface p-5 hud-corners text-ice overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} color="#FF5A2B" />
          <span className="text-[13px] font-semibold text-text-mid uppercase tracking-wide">Tes objectifs du jour</span>
        </div>
        <span className="font-mono text-[12.5px] text-text-mid">
          {doneToday}/{group.objectives.length}
        </span>
      </div>

      {group.objectives.length === 0 && <div className="text-text-low text-[13.5px]">Aucun objectif défini.</div>}

      <div className="flex flex-col gap-2">
        {group.objectives.map((obj) => {
          const done = meMember?.checkins[today]?.includes(obj.id) ?? false;
          return (
            <CheckItem key={obj.id} text={obj.text} done={done} onToggle={() => onCheckIn(obj.id)} />
          );
        })}
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded border border-ice/50 bg-ice/10 px-4 py-3 text-[13px] text-ice font-semibold flex items-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(95,203,238,0.25)' }}
          >
            <Flame size={15} /> Journée complète. La cellule tient.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckItem({ text, done, onToggle }: { text: string; done: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className="relative w-full flex items-center gap-3 px-3.5 py-3 rounded text-left overflow-hidden transition-colors"
      style={{
        background: done ? 'rgba(95,203,238,0.08)' : '#08090C',
        border: `1px solid ${done ? '#5FCBEE' : '#242938'}`,
        boxShadow: done ? '0 0 14px rgba(95,203,238,0.15)' : undefined,
      }}
    >
      <motion.div
        animate={done ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={{
          border: `1.5px solid ${done ? '#5FCBEE' : '#4B525E'}`,
          background: done ? '#5FCBEE' : 'transparent',
        }}
      >
        {done && <Check size={13} color="#08090C" strokeWidth={3} />}
      </motion.div>
      <span className={`text-[14px] ${done ? 'text-text-hi line-through' : 'text-text-mid'}`}>{text}</span>
    </motion.button>
  );
}

function GroupTab({
  group,
  me,
  pctFor,
  streakFor,
  today,
}: {
  group: Group;
  me: Identity;
  pctFor: (m: Member) => number;
  streakFor: (m: Member) => number;
  today: string;
}) {
  const ranked = group.members.slice().sort((a, b) => pctFor(b) - pctFor(a));
  const medalColor = ['#E8B84B', '#B8C4D0', '#B08968'];
  return (
    <div>
      <div className="grid gap-2.5">
        {ranked.map((m, idx) => {
          const pct = pctFor(m);
          const streak = streakFor(m);
          const isMe = m.id === me.id;
          const checkedToday = m.checkins[today]?.length || 0;
          return (
            <div
              key={m.id}
              className="rounded px-4 py-3.5 flex items-center gap-3.5"
              style={{
                background: isMe ? 'rgba(95,203,238,0.05)' : '#111319',
                border: `1px solid ${isMe ? '#2F5560' : '#242938'}`,
              }}
            >
              <div
                className="w-6 text-center font-mono text-[13px] font-bold flex-shrink-0"
                style={{ color: idx < 3 ? medalColor[idx] : '#4B525E' }}
              >
                #{idx + 1}
              </div>
              <Avatar name={m.name} id={m.id} active={isMe} />
              <RankBadge pct={pct} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[14.5px] font-semibold">
                    {m.name} {isMe && <span className="text-text-low font-normal">(toi)</span>}
                  </span>
                  {m.city && (
                    <span className="flex items-center gap-0.5 text-text-low text-[11.5px]">
                      <MapPin size={11} /> {m.city}
                    </span>
                  )}
                  {streak > 0 && (
                    <span className="flex items-center gap-0.5 text-ember text-[12px] font-mono">
                      <Flame size={12} className="animate-flicker" /> {streak}
                    </span>
                  )}
                </div>
                <Progress pct={pct} color={isMe ? '#5FCBEE' : '#4B525E'} />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[16px] font-bold font-mono">{pct}%</div>
                <div className="text-[10.5px] text-text-low">
                  {checkedToday}/{group.objectives.length} aujourd'hui
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {group.members.length < 5 && (
        <div className="mt-4 p-3.5 border border-dashed border-line rounded text-center">
          <div className="text-[12.5px] text-text-low">
            Partage le code <span className="text-ice font-mono">{group.code}</span> pour compléter la cellule (
            {group.members.length}/5)
          </div>
        </div>
      )}
    </div>
  );
}

function ChatTab({
  group,
  me,
  onSendMessage,
}: {
  group: Group;
  me: Identity;
  onSendMessage: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messages = group.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="border border-line rounded bg-surface flex flex-col" style={{ height: 440 }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <div className="text-text-low text-[13px] text-center mt-8">Rien encore. Premier message, premier lien.</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.authorId === me.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[11px] text-text-low mb-0.5">{isMe ? 'Toi' : msg.authorName}</div>
              <div
                className="max-w-[75%] px-3.5 py-2.5 rounded text-[13.5px] leading-relaxed text-text-hi"
                style={{
                  background: isMe ? 'rgba(95,203,238,0.12)' : '#191C24',
                  border: `1px solid ${isMe ? '#2F5560' : '#242938'}`,
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-line">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Écris un mot à la cellule"
          className="flex-1 px-3 py-2.5 bg-void border border-line rounded text-text-hi text-[13.5px] focus:border-ice transition-colors"
        />
        <button
          onClick={send}
          className="bg-ice border-none rounded px-3.5 flex items-center justify-center hover:brightness-110 transition-[filter]"
          aria-label="Envoyer"
        >
          <Send size={15} color="#08090C" />
        </button>
      </div>
    </div>
  );
}

function StatsTab({ group, me, pctFor }: { group: Group; me: Identity; pctFor: (m: Member) => number }) {
  const [selected, setSelected] = useState(me.id);
  const member = group.members.find((m) => m.id === selected) || group.members[0];
  const WEEKS = 10;
  const totalDays = WEEKS * 7;

  const cells: { key: string; ratio: number; date: Date }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - (totalDays - 1));
  for (let i = 0; i < totalDays; i++) {
    const key = formatDay(d);
    const done = member.checkins[key]?.length || 0;
    const total = group.objectives.length;
    const ratio = total > 0 ? done / total : 0;
    cells.push({ key, ratio, date: new Date(d) });
    d.setDate(d.getDate() + 1);
  }
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const colorFor = (ratio: number) => {
    if (ratio === 0) return '#191C24';
    if (ratio < 0.5) return '#2F5560';
    if (ratio < 1) return '#3A9FBF';
    return '#5FCBEE';
  };

  return (
    <div>
      <div className="flex gap-2 mb-4.5 flex-wrap">
        {group.members.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded text-[12.5px] text-text-hi transition-colors"
            style={{
              background: selected === m.id ? 'rgba(95,203,238,0.1)' : '#111319',
              border: `1px solid ${selected === m.id ? '#5FCBEE' : '#242938'}`,
            }}
          >
            <Avatar name={m.name} id={m.id} size={20} />
            {m.name}
          </button>
        ))}
      </div>

      <div className="border border-line rounded bg-surface p-5 mb-4">
        <div className="flex justify-between mb-4">
          <span className="text-[13px] font-semibold text-text-mid uppercase tracking-wide">10 dernières semaines</span>
          <span className="text-[16px] font-bold font-mono text-ice">{pctFor(member)}%</span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((c) => (
                <div
                  key={c.key}
                  title={`${c.date.toLocaleDateString('fr-CH')} · ${Math.round(c.ratio * 100)}%`}
                  className="w-[13px] h-[13px] rounded-[3px] transition-transform hover:scale-125"
                  style={{ background: colorFor(c.ratio) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-text-low">
          <span>Moins</span>
          {[0, 0.3, 0.6, 1].map((r) => (
            <div key={r} className="w-[11px] h-[11px] rounded-[3px]" style={{ background: colorFor(r) }} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      <div className="grid gap-2">
        {group.objectives.map((obj) => {
          const daysWithObj = Object.values(member.checkins).filter((arr) => arr.includes(obj.id)).length;
          return (
            <div key={obj.id} className="flex justify-between px-3.5 py-2.5 bg-surface border border-line rounded">
              <span className="text-[13px] text-text-mid">{obj.text}</span>
              <span className="text-[13px] font-mono text-text-hi">{daysWithObj}j</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
