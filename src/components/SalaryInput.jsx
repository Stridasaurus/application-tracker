import { Field, inputCls } from './ui.jsx'
import { SALARY_PERIODS } from '../domain/constants.js'

// Flexible salary editor: range (jobs), stipend (PhD), or N/A.
export default function SalaryInput({ value, onChange }) {
  const salary = value ?? { type: 'na', currency: 'USD', period: 'year' }
  const set = (patch) => onChange({ ...salary, ...patch })

  return (
    <div className="space-y-2">
      <Field label="Compensation">
        <select className={inputCls} value={salary.type} onChange={(e) => set({ type: e.target.value })}>
          <option value="na">N/A — none / unknown</option>
          <option value="range">Salary range</option>
          <option value="stipend">Stipend (PhD)</option>
        </select>
      </Field>

      {salary.type === 'range' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min">
            <input
              type="number"
              className={inputCls}
              value={salary.min ?? ''}
              placeholder="e.g. 100000"
              onChange={(e) => set({ min: e.target.value })}
            />
          </Field>
          <Field label="Max">
            <input
              type="number"
              className={inputCls}
              value={salary.max ?? ''}
              placeholder="e.g. 150000"
              onChange={(e) => set({ max: e.target.value })}
            />
          </Field>
        </div>
      )}

      {salary.type === 'stipend' && (
        <Field label="Stipend amount">
          <input
            type="number"
            className={inputCls}
            value={salary.amount ?? ''}
            placeholder="e.g. 45000"
            onChange={(e) => set({ amount: e.target.value })}
          />
        </Field>
      )}

      {salary.type !== 'na' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Currency">
            <select className={inputCls} value={salary.currency ?? 'USD'} onChange={(e) => set({ currency: e.target.value })}>
              {['USD', 'GBP', 'EUR', 'CAD'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Per">
            <select className={inputCls} value={salary.period ?? 'year'} onChange={(e) => set({ period: e.target.value })}>
              {SALARY_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </div>
  )
}

const SYMBOL = { USD: '$', GBP: '£', EUR: '€', CAD: 'C$' }

export function formatSalary(salary) {
  if (!salary || salary.type === 'na') return null
  const sym = SYMBOL[salary.currency] ?? ''
  const per = salary.period && salary.period !== 'total' ? `/${salary.period}` : ''
  const fmt = (n) => {
    const v = Number(n)
    if (isNaN(v)) return null
    return v >= 1000 ? `${sym}${Math.round(v / 1000)}k` : `${sym}${v}`
  }
  if (salary.type === 'range') {
    const lo = fmt(salary.min)
    const hi = fmt(salary.max)
    if (lo && hi) return `${lo}–${hi}${per}`
    return (lo || hi) ? `${lo || hi}${per}` : null
  }
  if (salary.type === 'stipend') {
    const a = fmt(salary.amount)
    return a ? `${a}${per} stipend` : null
  }
  return null
}
