import { AlertTriangle, UserCheck } from 'lucide-react';
import { EscalationInfo } from '../types/chat';

interface EscalationCardProps {
  escalation: EscalationInfo;
}

export default function EscalationCard({ escalation }: EscalationCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3 shadow-sm max-w-2xl">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>Handoff to Support Agent Initiated</span>
      </div>

      <div className="space-y-1.5 text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold select-none min-w-[70px] inline-block text-amber-800 dark:text-amber-400">TICKET:</span>
          <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/50 font-bold select-all">
            {escalation.ticket_id}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold select-none min-w-[70px] inline-block text-amber-800 dark:text-amber-400">REASON:</span>
          <span>{escalation.reason}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold select-none min-w-[70px] inline-block text-amber-800 dark:text-amber-400">SUMMARY:</span>
          <span>{escalation.summary}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1.5 border-t border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-600 dark:text-amber-400/80">
        <UserCheck className="w-3.5 h-3.5" />
        <span>A technician is reviewing your full chat logs.</span>
      </div>
    </div>
  );
}
