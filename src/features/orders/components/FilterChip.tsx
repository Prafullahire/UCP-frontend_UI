import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { FilterOption } from '../types';

interface BaseProps {
  label: string;
  icon?: React.ReactNode;
  alignRight?: boolean;
}

interface SingleProps extends BaseProps {
  options: FilterOption[];
  value: string | null;
  mode: 'single';
  onChange: (id: string | null) => void;
}

interface MultiProps extends BaseProps {
  options: FilterOption[];
  values: string[];
  mode: 'multi';
  onChange: (values: string[]) => void;
  countNoun?: string;
}

type FilterChipProps = SingleProps | MultiProps;

export const FilterChip: React.FC<FilterChipProps> = (props) => {
  const { label, icon, alignRight, options } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  
  // Custom range state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset calendar view state when closed
        if (!props.value || (props.mode === 'single' && props.value !== 'custom' && !props.value.includes('_'))) {
          setShowCustomCalendar(false);
        }
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [props.value, props.mode]);

  const isMulti = props.mode === 'multi';
  const selectedCount = isMulti ? props.values.length : props.value ? 1 : 0;
  const isOn = isMulti
    ? props.values.length > 0
    : !!props.value && (!!options.find((o) => o.id === props.value) || props.value.includes('_') || props.value === 'custom');

  const display = useMemo(() => {
    if (isMulti) {
      if (props.values.length === 0) return label;
      if (props.values.length === 1) {
        const opt = options.find((o) => o.id === props.values[0]);
        return `${label}: ${opt?.label ?? props.values[0]}`;
      }
      const noun = props.countNoun ?? 'selected';
      return `${label}: ${props.values.length} ${noun}`;
    }
    
    // Single mode logic
    const selected = options.find((o) => o.id === props.value);
    if (selected && selected.id !== 'custom') {
       return `${label}: ${selected.label}`;
    }
    if (props.value && props.value.includes('_')) {
      const [start, end] = props.value.split('_');
      const parseDate = (dStr: string) => {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        // e.g. "17/03"
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };
      if (start && end) {
        return `${label}: ${parseDate(start)} - ${parseDate(end)}`;
      }
    }
    return selected ? `${label}: ${selected.label}` : label;
  }, [isMulti, props.values, props.value, props.countNoun, options, label]);

  const togglePick = (id: string) => {
    if (props.mode === 'multi') {
      const next = props.values.includes(id)
        ? props.values.filter((v) => v !== id)
        : [...props.values, id];
      props.onChange(next);
    } else {
      if (id === 'custom') {
         setShowCustomCalendar(true);
      } else {
         props.onChange(props.value === id ? null : id);
         setOpen(false);
         setShowCustomCalendar(false);
      }
    }
  };

  const handleApplyCalendar = () => {
    if (props.mode === 'single' && startDate) {
      const startD = startDate;
      const endD = endDate || startDate;
      // Create local date strings in YYYY-MM-DD
      const startStr = `${startD.getFullYear()}-${String(startD.getMonth()+1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
      const endStr = `${endD.getFullYear()}-${String(endD.getMonth()+1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
      props.onChange(`${startStr}_${endStr}`);
    } else if (props.mode === 'single') {
      props.onChange('custom'); 
    }
    setOpen(false);
  };
  
  const handleCalendarCancel = () => {
     setShowCustomCalendar(false);
  }

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const calendarDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(currentYear, currentMonth, i) });
  }
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(currentYear, currentMonth + 1, i) });
  }

  const handleDayClick = (date: Date) => {
    // Reset time to start of day to avoid timezone matching issues
    const normDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!startDate || (startDate && endDate)) {
      setStartDate(normDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (normDate < startDate) {
        setEndDate(startDate);
        setStartDate(normDate);
      } else {
        setEndDate(normDate);
      }
    }
  };

  const isSelected = (d: Date) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const s = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
    const e = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
    
    if (s && !e && date.getTime() === s.getTime()) return 'start';
    if (s && e) {
      if (date.getTime() === s.getTime()) return 'start';
      if (date.getTime() === e.getTime()) return 'end';
      if (date > s && date < e) return 'in-range';
    }
    return false;
  };

  const formatInputDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`ord-fc ${isOn ? 'on' : ''}`}
        onClick={() => {
          if (!open && props.mode === 'single' && (props.value === 'custom' || (props.value && props.value.includes('_')))) {
             setShowCustomCalendar(true);
             // If we already have a custom range, initialize the calendar with it
             if (props.value && props.value.includes('_')) {
               const [s, e] = props.value.split('_');
               const sD = new Date(s);
               const eD = new Date(e);
               if (!isNaN(sD.getTime()) && !isNaN(eD.getTime())) {
                 setStartDate(new Date(sD.getFullYear(), sD.getMonth(), sD.getDate()));
                 setEndDate(new Date(eD.getFullYear(), eD.getMonth(), eD.getDate()));
                 setCurrentMonth(eD.getMonth());
                 setCurrentYear(eD.getFullYear());
               }
             }
          }
          setOpen((p) => !p);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && <span className="ord-fc-ico">{icon}</span>}
        <span>{display}</span>
        <span className="ord-fc-chev">▾</span>
      </button>

      {open && !showCustomCalendar && (
        <div className={`ord-dd ${alignRight ? 'right' : ''}`} role="listbox">
          <div className="ord-dd-body">
            {options.map((opt) => {
              const checked = isMulti
                ? props.values.includes(opt.id)
                : props.value === opt.id || (opt.id === 'custom' && props.value?.includes('_'));
              return (
                <div
                  key={opt.id}
                  className={`ord-dd-i ${checked ? 'on' : ''}`}
                  onClick={() => togglePick(opt.id)}
                  role="option"
                  aria-selected={checked}
                >
                  {isMulti && <span className="cb" aria-hidden="true" />}
                  <span>{opt.label}</span>
                </div>
              );
            })}
          </div>
          {isMulti && selectedCount > 0 && (
            <div className="ord-dd-ft">
              <button
                type="button"
                className="lk"
                onClick={() => props.onChange([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="lk p"
                onClick={() => setOpen(false)}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {open && showCustomCalendar && (
         <div className={`ord-dd ${alignRight ? 'right' : ''}`} style={{ width: '380px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#f8fafc', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={formatInputDate(startDate)} 
                readOnly 
                placeholder="Start Date"
                style={{ 
                   flex: 1, padding: '8px', border: '1px solid #3b82f6', borderRadius: '4px', outline: 'none', 
                   textAlign: 'center', color: '#3b82f6', fontSize: '14px', background: '#fff',
                   boxShadow: '0 0 0 1px #3b82f6'
                }}
              />
              <input 
                type="text" 
                value={formatInputDate(endDate)} 
                readOnly 
                placeholder="End Date"
                style={{ 
                   flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', 
                   textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: '#fff' 
                }}
              />
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={handlePrevMonth} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{ appearance: 'none', border: 'none', background: 'transparent', fontSize: '15px', fontWeight: '500', color: '#475569', cursor: 'pointer', outline: 'none', paddingRight: '16px' }}>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} style={{ appearance: 'none', border: 'none', background: 'transparent', fontSize: '15px', fontWeight: '500', color: '#475569', cursor: 'pointer', outline: 'none', paddingRight: '16px' }}>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <button onClick={handleNextMonth} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', textAlign: 'center', marginBottom: '8px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', paddingBottom: '8px' }}>{day}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', rowGap: '8px', textAlign: 'center' }}>
                {calendarDays.map((d, i) => {
                  const state = isSelected(d.date);
                  let color = d.isCurrentMonth ? '#475569' : '#cbd5e1';
                  if (state) color = '#fff';

                  return (
                    <div key={i} style={{ padding: '0', position: 'relative', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {state === 'start' && endDate && <div style={{ position: 'absolute', right: 0, top: '2px', bottom: '2px', width: '50%', background: '#3b82f6', zIndex: 0 }} />}
                      {state === 'end' && startDate && <div style={{ position: 'absolute', left: 0, top: '2px', bottom: '2px', width: '50%', background: '#3b82f6', zIndex: 0 }} />}
                      {state === 'in-range' && <div style={{ position: 'absolute', left: 0, right: 0, top: '2px', bottom: '2px', background: '#3b82f6', zIndex: 0 }} />}
                      
                      <div 
                        onClick={() => handleDayClick(d.date)}
                        style={{ 
                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%',
                          background: state === 'start' || state === 'end' ? '#3b82f6' : 'transparent',
                          color: color,
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 1,
                          fontSize: '14px',
                          fontWeight: state ? '500' : '400',
                          textDecoration: state === 'end' ? 'underline' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!state) e.currentTarget.style.background = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          if (!state) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {d.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
              <button 
                onClick={handleCalendarCancel}
                style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
              >
                Back
              </button>
              <button 
                onClick={handleApplyCalendar}
                style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default FilterChip;
