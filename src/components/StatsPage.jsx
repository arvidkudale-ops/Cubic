import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { groupByDay, histogram, rollingSeries, summarize } from '../engine/stats.js';
import { effectiveMs, formatTime, penaltyLabel } from '../engine/time.js';
import { useStore } from '../state/Store.jsx';
import { Empty } from './ui.jsx';

const tip = { background: '#151923', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: '#f3f4f6' };

export function StatsPage() {
  const { sessions, session, actions, settings } = useStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [penalty, setPenalty] = useState('all');
  const [limit, setLimit] = useState(0);
  const source = session?.solves || [];
  const filtered = useMemo(() => {
    let list = source.filter((solve) => {
      if (penalty !== 'all' && solve.penalty !== penalty) return false;
      const day = new Date(solve.date).toISOString().slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    if (limit > 0) list = list.slice(-limit);
    return list;
  }, [source, from, to, penalty, limit]);
  const stats = summarize(filtered, { customAo: settings.stats.customAo || 100 });
  const series = rollingSeries(filtered, 5, 1);
  const ao12 = rollingSeries(filtered, 12, 1);
  const trend = series.map((point, index) => ({ index: point.index, time: point.time, ao5: point.avg, ao12: ao12[index]?.avg }));
  const days = groupByDay(filtered);
  const months = groupMonths(days);
  const tps = filtered.flatMap((solve, index) => {
    if (!Array.isArray(solve.moves) || !solve.moves.length) return [];
    const ms = effectiveMs(solve);
    if (ms == null) return [];
    return [{ index: index + 1, tps: Number((solve.moves.length / (ms / 1000)).toFixed(2)) }];
  });
  const cards = [
    ['Solves', filtered.length],
    ['Best', fmt(stats.single?.ms)],
    ['Best Ao5', fmt(stats.bestAo5?.ms)],
    ['Best Ao12', fmt(stats.bestAo12?.ms)],
    ['Mean', fmt(stats.mean)],
    ['Ao5', stats.ao5?.dnf ? 'DNF' : fmt(stats.ao5?.ms)],
    ['Ao12', stats.ao12?.dnf ? 'DNF' : fmt(stats.ao12?.ms)],
    ['Personal bests', countBests(filtered)],
  ];
  return (
    <div className="scroll-y min-h-0 flex-1 space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Statistics</h2>
          <p className="text-sm text-[var(--muted)]">{session?.name}. Changing the session here also selects it for the timer.</p>
        </div>
        <select className="field w-auto" value={session?.id || ''} onChange={(event) => actions.selectSession(event.target.value)}>
          {sessions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="field w-auto" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className="field w-auto" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <select className="field w-auto" value={penalty} onChange={(event) => setPenalty(event.target.value)}>
          <option value="all">All penalties</option>
          <option value="ok">OK</option>
          <option value="plus2">+2</option>
          <option value="dnf">DNF</option>
        </select>
        <select className="field w-auto" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
          <option value={0}>All solves</option>
          {[50, 100, 200, 500].map((n) => <option key={n} value={n}>Last {n}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
            <div className="timer-digits mt-1 text-2xl">{value}</div>
          </div>
        ))}
      </div>
      {!filtered.length && <Empty>No solves match these filters.</Empty>}
      {filtered.length > 1 && (
        <>
          <Panel title="Times, Ao5, and Ao12">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="index" stroke="#9299A8" />
                  <YAxis stroke="#9299A8" tickFormatter={(value) => value ? (value / 1000).toFixed(1) : ''} />
                  <Tooltip contentStyle={tip} formatter={(value) => value ? formatTime(value, 2) : '—'} />
                  <Line dataKey="time" stroke="var(--accent)" dot={false} connectNulls strokeWidth={2} />
                  <Line dataKey="ao5" stroke="var(--accent-2)" dot={false} connectNulls strokeWidth={2} />
                  <Line dataKey="ao12" stroke="var(--warn)" dot={false} connectNulls strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Distribution">
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={histogram(filtered, settings.stats.distBin)}>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="label" stroke="#9299A8" />
                    <YAxis stroke="#9299A8" allowDecimals={false} />
                    <Tooltip contentStyle={tip} />
                    <Bar dataKey="count" fill="var(--accent)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Daily solves">
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={days}>
                    <XAxis dataKey="date" stroke="#9299A8" hide={days.length > 12} />
                    <YAxis stroke="#9299A8" allowDecimals={false} />
                    <Tooltip contentStyle={tip} />
                    <Bar dataKey="count" fill="var(--accent-2)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title="Monthly activity">
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={months}>
                  <XAxis dataKey="month" stroke="#9299A8" />
                  <YAxis stroke="#9299A8" allowDecimals={false} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="count" fill="#8B7CFF" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Turns per second">
            {tps.length ? (
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={tps}>
                    <XAxis dataKey="index" stroke="#9299A8" />
                    <YAxis stroke="#9299A8" />
                    <Tooltip contentStyle={tip} />
                    <Line dataKey="tps" stroke="var(--accent-2)" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty>TPS appears when a solve has recorded moves from the virtual cube or a smart cube. A stopwatch time alone is not enough.</Empty>}
          </Panel>
        </>
      )}
      <div className="card overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[var(--muted)]"><tr><th className="p-3">#</th><th>Time</th><th>Date</th><th>Penalty</th><th>Scramble</th><th>Comment</th></tr></thead>
          <tbody>
            {filtered.map((solve, index) => (
              <tr key={solve.id} className="cursor-pointer border-t border-[var(--line)] hover:bg-white/5" onClick={() => actions.setModal({ type: 'solve', id: solve.id })}>
                <td className="p-3">{index + 1}</td>
                <td className="timer-digits">{formatTime(effectiveMs(solve), 2)}</td>
                <td>{new Date(solve.date).toLocaleString()}</td>
                <td>{penaltyLabel(solve.penalty) || 'OK'}</td>
                <td className="max-w-xs truncate scramble-text text-xs">{solve.scramble}</td>
                <td>{solve.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return <section className="card p-4"><h3 className="mb-3 text-sm font-medium">{title}</h3>{children}</section>;
}

function fmt(ms) {
  return ms == null ? '—' : formatTime(ms, 2);
}

function countBests(solves) {
  let best = Infinity;
  let count = 0;
  solves.forEach((solve) => {
    const ms = effectiveMs(solve);
    if (ms == null) return;
    if (ms < best) { best = ms; count += 1; }
  });
  return count;
}

function groupMonths(days) {
  const map = new Map();
  days.forEach((day) => {
    const month = day.date.slice(0, 7);
    map.set(month, (map.get(month) || 0) + day.count);
  });
  return [...map.entries()].map(([month, count]) => ({ month, count }));
}
