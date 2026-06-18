import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import { TRACK_BY_ID } from '../domain/constants.js'
import {
  funnelByStatus,
  countByTrack,
  responseRate,
  averageTimeToResponse,
  applicationsByWeek,
  salaryDistribution,
  isActive,
} from '../domain/metrics.js'
import { formatDate } from '../domain/dates.js'
import DeadlinesView from './DeadlinesView.jsx'

function Panel({ title, subtitle, children, className }) {
  return (
    <section
      className={
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ' +
        (className ?? '')
      }
    >
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

const axisProps = {
  tick: { fontSize: 11, fill: 'currentColor' },
  stroke: 'currentColor',
}

export default function Dashboard({ apps, now, onOpen }) {
  const jobFunnel = funnelByStatus(apps, 'job')
  const phdFunnel = funnelByStatus(apps, 'phd')
  const byTrack = countByTrack(apps).filter((t) => t.count > 0)
  const rr = responseRate(apps)
  const ttr = averageTimeToResponse(apps)
  const weekly = applicationsByWeek(apps).map((w) => ({ ...w, label: formatDate(w.weekISO) }))
  const { points, excluded } = salaryDistribution(apps)
  const activeCount = apps.filter(isActive).length

  const hasJobs = jobFunnel.some((s) => s.count > 0)
  const hasPhd = phdFunnel.some((s) => s.count > 0)

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total applications" value={apps.length} sub={`${activeCount} active`} />
        <Stat
          label="Response rate"
          value={`${Math.round(rr.rate * 100)}%`}
          sub={`${rr.responded}/${rr.applied} advanced past Applied`}
        />
        <Stat
          label="Avg. time to response"
          value={ttr.avgDays == null ? '—' : `${ttr.avgDays.toFixed(1)}d`}
          sub={ttr.sampleSize ? `n = ${ttr.sampleSize}` : 'no responses yet'}
        />
        <Stat label="Tracks in play" value={byTrack.length} sub="of 6" />
      </div>

      {/* Deadlines — headline feature */}
      <Panel
        title="📌 Upcoming deadlines"
        subtitle="Active applications, soonest first. Overdue items are flagged."
      >
        <DeadlinesView apps={apps} now={now} onOpen={onOpen} limit={8} />
      </Panel>

      {/* Track balance */}
      <Panel
        title="Applications by track"
        subtitle="Is the multi-track search staying balanced, or over-investing in one prong?"
      >
        {byTrack.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byTrack} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="label" width={120} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {byTrack.map((t) => (
                  <Cell key={t.id} fill={t.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Funnels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {hasJobs && (
          <Panel title="Job pipeline funnel" subtitle="Quant · Neuro · Defense · Fusion">
            <Funnel data={jobFunnel} color="#6366f1" />
          </Panel>
        )}
        {hasPhd && (
          <Panel title="PhD pipeline funnel" subtitle="Applications, interviews, outcomes">
            <Funnel data={phdFunnel} color="#10b981" />
          </Panel>
        )}
      </div>

      {/* Applications over time */}
      <Panel title="Applications over time" subtitle="Submitted per week (by date applied)">
        {weekly.length === 0 ? (
          <Empty hint="No application dates yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Salary / stipend distribution */}
      <Panel
        title="Salary / stipend distribution"
        subtitle={`Across entries with comp data. ${excluded} entr${excluded === 1 ? 'y' : 'ies'} excluded (no salary — never counted as zero).`}
      >
        {points.length === 0 ? (
          <Empty hint="No comp data entered yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 16, right: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                type="number"
                dataKey="value"
                name="value"
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                {...axisProps}
              />
              <YAxis type="category" dataKey="type" {...axisProps} width={70} />
              <ZAxis range={[120, 120]} />
              <Tooltip content={<SalaryTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={points}>
                {points.map((p) => (
                  <Cell key={p.id} fill={TRACK_BY_ID[p.track]?.color ?? '#64748b'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  )
}

function Funnel({ data, color }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.stage} className="flex items-center gap-2">
          <div className="w-32 flex-shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
            {d.stage}
          </div>
          <div className="h-6 flex-1 rounded bg-slate-100 dark:bg-slate-800">
            <div
              className="flex h-6 items-center justify-end rounded px-2 text-xs font-semibold text-white"
              style={{ width: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%`, backgroundColor: color }}
            >
              {d.count > 0 && d.count}
            </div>
          </div>
          <div className="w-6 text-right text-xs text-slate-400">{d.count}</div>
        </div>
      ))}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div className="font-medium">{payload[0].payload.label ?? label}</div>
      <div>{payload[0].value} application(s)</div>
    </div>
  )
}

function SalaryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div className="font-medium">{p.company}</div>
      <div>
        {p.currency} {Math.round(p.value).toLocaleString()}/{p.period} · {p.type}
      </div>
    </div>
  )
}

function Empty({ hint }) {
  return (
    <div className="py-8 text-center text-sm text-slate-400">{hint ?? 'Nothing to show yet.'}</div>
  )
}
