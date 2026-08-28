import type { ParkStatus } from '@/types/database';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/lib/constants';

export default function StatusBadge({ status }: { status: ParkStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
