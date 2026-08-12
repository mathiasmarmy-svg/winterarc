import { useEffect, useMemo, useRef, useState } from 'react';
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
  Trophy,
  Settings2,
  Plus,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wordmark, Avatar, RankBadge, BeltLabel, Progress, TabPanel, StaggerItem } from '../components/UI';
import { formatDay, todayKey, activeObjectives, founderIdOf, isFounder, streakFor, uid } from '../lib/utils';
import { computeBelt, cumulativeActiveDays } from '../lib/belt';
import { fetchAllGroups } from '../lib/store';
import type { Group, Identity, Member, Objective } from '../types';

interface DashboardProps {
  group: Group;
  me: Identity;
  onCheckIn: (objectiveId: string) => void;
  onLeave: () => void;
  onSendMessage: (text: string) => void;
  onUpdateObjectives: (objectives: Objective[]) => void;
}

const TABS = [
  { key: 'today', label: 'Today', icon: Target },
  { key: 'group', label: 'Cell', icon: Users },
  { key: 'rankings', label: 'Rankings', icon: Trophy },
  { key: 'chat', label: 'Chat', icon: MessageCircle },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function Dashboard({ group, me, onCheckIn, onLeave, onSendMessage, onUpdateObjectives }: DashboardProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabKey>('today');
  const today = todayKey();
  const meMember = group.members.find((m) => m.id === me.id);
  const founder = isFounder(group, me.id);

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
            <Copy size={12} /> {copied ? 'Copied!' : group.code}
          </button>
          <button
            onClick={onLeave}
            className="bg-transparent border-none text-text-low p-2 hover:text-ember transition-colors"
            aria-label="Leave"
            title="Leave (this device)"
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
              className={`relative bg-transparent border-none px-3.5 py-2.5 flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors -mb-px ${
                active ? 'text-text-hi' : 'text-text-low hover:text-text-mid'
              }`}
            >
              <Icon size={14} /> {t.label}
              {active && (
                <motion.div layoutId="tab-underline" className="absolute left-0 right-0 -bottom-px h-[2px] bg-ice" style={{ boxShadow: '0 0 8px #5FCBEE' }} />
              )}
            </button>
          );
        })}
      </div>

      <TabPanel tabKey={tab}>
        {tab === 'today' && (
          <TodayTab group={group} meMember={meMember} today={today} onCheckIn={onCheckIn} isFounder={founder} onUpdateObjectives={onUpdateObjectives} />
        )}
        {tab === 'group' && <GroupTab group={group} me={me} today={today} />}
        {tab === 'rankings' && <RankingsTab group={group} me={me} />}
        {tab === 'chat' && <ChatTab group={group} me={me} onSendMessage={onSendMessage} />}
        {tab === 'stats' && <StatsTab group={group} me={me} />}
      </TabPanel>
    </div>
  );
}

// ---------- Today ----------
function TodayTab({
  group,
  meMember,
  today,
  onCheckIn,
  isFounder,
  onUpdateObjectives,
}: {
  group: Group;
  meMember?: Member;
  today: string;
  onCheckIn: (objectiveId: string) => void;
  isFounder: boolean;
  onUpdateObjectives: (objectives: Objective[]) => void;
}) {
  const [managing, setManaging] = useState(false);
  const active = activeObjectives(group);
  const doneToday = active.filter((o) => meMember?.checkins[today]?.includes(o.id)).length;
  const allDone = active.length > 0 && doneToday === active.length;

  return (
    <div className="relative border border-line rounded panel p-5 hud-corners text-ice overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} color="#FF5A2B" />
          <span className="text-[13px] font-bold text-text-mid uppercase tracking-[1.5px]">Today's goals</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12.5px] text-text-mid">
            {doneToday}/{active.length}
          </span>
          {isFounder && (
            <button
              onClick={() => setManaging((v) => !v)}
              className={`p-1.5 rounded border transition-colors ${managing ? 'text-ice border-ice bg-ice/10' : 'text-text-low border-line hover:text-ice hover:border-ice'}`}
              aria-label="Manage goals"
              title="Manage goals"
            >
              <Settings2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Progress pct={active.length ? (doneToday / active.length) * 100 : 0} color="#FF5A2B" />
      </div>

      {active.length === 0 && !managing && <div className="text-text-low text-[13.5px]">No active goals.</div>}

      <div className="flex flex-col gap-2">
        {active.map((obj, i) => {
          const done = meMember?.checkins[today]?.includes(obj.id) ?? false;
          return (
            <StaggerItem key={obj.id} index={i}>
              <CheckItem text={obj.text} done={done} onToggle={() => onCheckIn(obj.id)} />
            </StaggerItem>
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
            <Flame size={15} /> Full day. The cell holds.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managing && isFounder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ObjectiveManager objectives={group.objectives} onSave={onUpdateObjectives} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ObjectiveManager({ objectives, onSave }: { objectives: Objective[]; onSave: (objectives: Objective[]) => void }) {
  const [draft, setDraft] = useState('');

  const commit = (next: Objective[]) => onSave(next);

  const editText = (id: string, text: string) => {
    commit(objectives.map((o) => (o.id === id ? { ...o, text } : o)));
  };
  const archive = (id: string) => commit(objectives.map((o) => (o.id === id ? { ...o, archived: true } : o)));
  const restore = (id: string) => commit(objectives.map((o) => (o.id === id ? { ...o, archived: false } : o)));
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    commit([...objectives, { id: uid(), text }]);
    setDraft('');
  };

  const active = objectives.filter((o) => !o.archived);
  const archived = objectives.filter((o) => o.archived);

  return (
    <div className="mt-5 pt-4 border-t border-line">
      <div className="text-[11px] text-text-low uppercase tracking-wider font-mono mb-3">
        Manage goals · founder only
      </div>
      <div className="flex flex-col gap-2 mb-2">
        {active.map((o) => (
          <div key={o.id} className="flex gap-2 items-center">
            <input
              value={o.text}
              onChange={(e) => editText(o.id, e.target.value)}
              className="flex-1 px-3 py-2 bg-void border border-line rounded text-text-hi text-[13.5px] focus:border-ice transition-colors"
            />
            <button
              onClick={() => archive(o.id)}
              className="p-2 text-text-low hover:text-ember transition-colors"
              aria-label="Archive goal"
              title="Archive (keeps past check-ins)"
            >
              <Archive size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="New goal…"
          className="flex-1 px-3 py-2 bg-void border border-dashed border-line rounded text-text-hi text-[13.5px] focus:border-ice transition-colors"
        />
        <button
          onClick={add}
          className="px-3 rounded border border-dashed border-line text-ice hover:border-ice transition-colors flex items-center gap-1 text-[13px]"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {archived.length > 0 && (
        <div className="pt-2">
          <div className="text-[10.5px] text-text-low uppercase tracking-wider font-mono mb-2">Archived</div>
          <div className="flex flex-col gap-1.5">
            {archived.map((o) => (
              <div key={o.id} className="flex gap-2 items-center text-text-low">
                <span className="flex-1 text-[13px] line-through truncate">{o.text}</span>
                <button onClick={() => restore(o.id)} className="p-1.5 hover:text-ice transition-colors" aria-label="Restore goal" title="Restore">
                  <RotateCcw size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckItem({ text, done, onToggle }: { text: string; done: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
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

// ---------- Cell leaderboard ----------
function GroupTab({ group, me, today }: { group: Group; me: Identity; today: string }) {
  const active = activeObjectives(group);
  const founderId = founderIdOf(group);
  const ranked = useMemo(
    () =>
      group.members
        .slice()
        .sort((a, b) => cumulativeActiveDays(b, group.objectives) - cumulativeActiveDays(a, group.objectives)),
    [group.members, group.objectives]
  );
  const medalColor = ['#E8B84B', '#B8C4D0', '#B08968'];

  return (
    <div>
      <div className="grid gap-2.5">
        {ranked.map((m, idx) => {
          const streak = streakFor(group.objectives, m);
          const isMe = m.id === me.id;
          const checkedToday = active.filter((o) => m.checkins[today]?.includes(o.id)).length;
          const belt = computeBelt(m, group.objectives);
          return (
            <StaggerItem key={m.id} index={idx}>
              <div
                className="rounded px-4 py-3.5 flex items-center gap-3.5 panel-row"
                style={{ border: `1px solid ${isMe ? '#2F5560' : '#242938'}` }}
              >
                <div className="w-6 text-center font-mono text-[13px] font-bold flex-shrink-0" style={{ color: idx < 3 ? medalColor[idx] : '#4B525E' }}>
                  #{idx + 1}
                </div>
                <Avatar name={m.name} id={m.id} active={isMe} />
                <RankBadge tier={belt.current} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[14.5px] font-semibold">
                      {m.name}
                      {isMe && <span className="text-text-low font-normal"> (you)</span>}
                      {founderId === m.id && <span className="text-ember font-normal text-[11px] ml-1 align-middle">FOUNDER</span>}
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
                  <BeltLabel current={belt.current} record={belt.record} />
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <Progress pct={active.length ? (checkedToday / active.length) * 100 : 0} color={isMe ? '#5FCBEE' : '#4B525E'} />
                  <div className="text-[10.5px] text-text-low mt-1.5">
                    {checkedToday}/{active.length} today
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </div>
      {group.members.length < 5 && (
        <div className="mt-4 p-3.5 border border-dashed border-line rounded text-center">
          <div className="text-[12.5px] text-text-low">
            Share code <span className="text-ice font-mono">{group.code}</span> to fill the cell ({group.members.length}/5)
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Rankings (global + inter-cell) ----------
function RankingsTab({ group, me }: { group: Group; me: Identity }) {
  const [view, setView] = useState<'players' | 'cells'>('players');
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllGroups()
      .then((all) => !cancelled && setGroups(all))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const players = useMemo(() => {
    if (!groups) return [];
    return groups
      .flatMap((g) => g.members.map((m) => ({ member: m, group: g, days: cumulativeActiveDays(m, g.objectives) })))
      .sort((a, b) => b.days - a.days);
  }, [groups]);

  const cells = useMemo(() => {
    if (!groups) return [];
    return groups
      .map((g) => ({
        group: g,
        totalDays: g.members.reduce((acc, m) => acc + cumulativeActiveDays(m, g.objectives), 0),
      }))
      .sort((a, b) => b.totalDays - a.totalDays);
  }, [groups]);

  if (loadError) {
    return <div className="text-text-low text-[13.5px]">Couldn't load rankings. Try again shortly.</div>;
  }
  if (!groups) {
    return <div className="text-text-low text-[13.5px]">Loading rankings…</div>;
  }

  const maxPlayerDays = players[0]?.days || 1;
  const maxCellDays = cells[0]?.totalDays || 1;
  const displayPlayers = players.slice(0, Math.min(players.length, 30));
  const displayCells = cells.slice(0, Math.min(cells.length, 20));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['players', 'cells'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3.5 py-2 rounded text-[12.5px] font-semibold transition-colors"
            style={{
              background: view === v ? 'rgba(95,203,238,0.1)' : 'transparent',
              border: `1px solid ${view === v ? '#5FCBEE' : '#242938'}`,
              color: view === v ? '#F4F6FA' : '#8D96A3',
            }}
          >
            {v === 'players' ? 'Players' : 'Cells'}
          </button>
        ))}
      </div>

      {view === 'players' && (
        <div>
          <div className="text-[11.5px] text-text-low font-mono mb-3">{players.length} player{players.length === 1 ? '' : 's'} ranked</div>
          <div className="grid gap-2">
            {displayPlayers.map((p, idx) => (
              <StaggerItem key={p.member.id} index={idx}>
                <div className="flex items-center gap-3 px-4 py-3 rounded panel-row border border-line">
                  <div className="w-6 text-center font-mono text-[12.5px] font-bold text-text-low flex-shrink-0">#{idx + 1}</div>
                  <Avatar name={p.member.name} id={p.member.id} active={p.member.id === me.id && p.group.code === group.code} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{p.member.name}</div>
                    <div className="text-[11px] text-text-low truncate">{p.group.name}</div>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <Progress pct={(p.days / maxPlayerDays) * 100} color="#5FCBEE" />
                  </div>
                  <div className="text-[12.5px] font-mono text-text-mid w-14 text-right flex-shrink-0">{p.days}d</div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </div>
      )}

      {view === 'cells' && (
        <div>
          <div className="text-[11.5px] text-text-low font-mono mb-3">{cells.length} cell{cells.length === 1 ? '' : 's'} ranked</div>
          <div className="grid gap-2">
            {displayCells.map((c, idx) => (
              <StaggerItem key={c.group.code} index={idx}>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded panel-row"
                  style={{ border: `1px solid ${c.group.code === group.code ? '#2F5560' : '#242938'}` }}
                >
                  <div className="w-6 text-center font-mono text-[12.5px] font-bold text-text-low flex-shrink-0">#{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">
                      {c.group.name} {c.group.code === group.code && <span className="text-ice font-normal text-[11px]">· your cell</span>}
                    </div>
                    <div className="text-[11px] text-text-low">{c.group.members.length} member{c.group.members.length === 1 ? '' : 's'}</div>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <Progress pct={(c.totalDays / maxCellDays) * 100} color="#FF5A2B" />
                  </div>
                  <div className="text-[12.5px] font-mono text-text-mid w-14 text-right flex-shrink-0">{c.totalDays}d</div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Chat ----------
function ChatTab({ group, me, onSendMessage }: { group: Group; me: Identity; onSendMessage: (text: string) => void }) {
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
    <div className="border border-line rounded panel flex flex-col" style={{ height: 440 }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <div className="text-text-low text-[13px] text-center mt-8">Nothing yet. First message, first bond.</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.authorId === me.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[11px] text-text-low mb-0.5">{isMe ? 'You' : msg.authorName}</div>
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
          placeholder="Say something to the cell"
          className="flex-1 px-3 py-2.5 bg-void border border-line rounded text-text-hi text-[13.5px] focus:border-ice transition-colors"
        />
        <button
          onClick={send}
          className="bg-ice border-none rounded px-3.5 flex items-center justify-center hover:brightness-110 transition-[filter]"
          aria-label="Send"
        >
          <Send size={15} color="#08090C" />
        </button>
      </div>
    </div>
  );
}

// ---------- Stats ----------
function StatsTab({ group, me }: { group: Group; me: Identity }) {
  const [selected, setSelected] = useState(me.id);
  const member = group.members.find((m) => m.id === selected) || group.members[0];
  const active = activeObjectives(group);
  const WEEKS = 10;
  const totalDays = WEEKS * 7;

  const cells: { key: string; ratio: number; date: Date }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - (totalDays - 1));
  for (let i = 0; i < totalDays; i++) {
    const key = formatDay(d);
    const done = active.filter((o) => member.checkins[key]?.includes(o.id)).length;
    const ratio = active.length > 0 ? done / active.length : 0;
    cells.push({ key, ratio, date: new Date(d) });
    d.setDate(d.getDate() + 1);
  }
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const chartData = cells.map((c) => ({
    label: c.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    pct: Math.round(c.ratio * 100),
  }));
  const overallPct = cells.length ? Math.round((cells.reduce((a, c) => a + c.ratio, 0) / cells.length) * 100) : 0;

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

      <div className="border border-line rounded panel p-5 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-[13px] font-bold text-text-mid uppercase tracking-[1.5px]">Progress over time</span>
          <span className="text-[16px] font-bold font-mono text-ice">{overallPct}%</span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="statsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5FCBEE" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#5FCBEE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#242938" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#4B525E', fontSize: 10 }} axisLine={{ stroke: '#242938' }} tickLine={false} interval={13} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4B525E', fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip
                contentStyle={{ background: '#141824', border: '1px solid #242938', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#8D96A3' }}
                itemStyle={{ color: '#5FCBEE' }}
                formatter={(value) => [`${value}%`, 'Completion']}
              />
              <Area type="monotone" dataKey="pct" stroke="#5FCBEE" strokeWidth={2} fill="url(#statsFill)" animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-line rounded panel p-5 mb-4">
        <div className="flex justify-between mb-4">
          <span className="text-[13px] font-bold text-text-mid uppercase tracking-[1.5px]">Last 10 weeks</span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((c) => (
                <div
                  key={c.key}
                  title={`${c.date.toLocaleDateString('en-GB')} · ${Math.round(c.ratio * 100)}%`}
                  className="w-[13px] h-[13px] rounded-[3px] transition-transform hover:scale-125"
                  style={{ background: colorFor(c.ratio) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-text-low">
          <span>Less</span>
          {[0, 0.3, 0.6, 1].map((r) => (
            <div key={r} className="w-[11px] h-[11px] rounded-[3px]" style={{ background: colorFor(r) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid gap-2">
        {group.objectives.map((obj) => {
          const daysWithObj = Object.values(member.checkins).filter((arr) => arr.includes(obj.id)).length;
          return (
            <div key={obj.id} className="flex justify-between px-3.5 py-2.5 panel border border-line rounded">
              <span className={`text-[13px] ${obj.archived ? 'text-text-low line-through' : 'text-text-mid'}`}>
                {obj.text}
                {obj.archived && <span className="ml-1.5 text-[10.5px]">(archived)</span>}
              </span>
              <span className="text-[13px] font-mono text-text-hi">{daysWithObj}d</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
