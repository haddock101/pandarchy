import { useEffect, useState } from "react";
import { useHoverTarget, type InfoRow } from "../hoverInfo.ts";

// Refreshing ten times a second keeps the numbers readable while still feeling live.
const REFRESH_MS = 100;

/** Shows the properties of whatever is under the pointer. Lives outside the Canvas, as plain DOM. */
export function DebugPanel() {
  const target = useHoverTarget();
  const [rows, setRows] = useState<InfoRow[]>([]);

  useEffect(() => {
    if (!target) return;
    const refresh = () => setRows(target.read());
    const first = requestAnimationFrame(refresh);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(timer);
    };
  }, [target]);

  if (!target) return null;
  return (
    <div className="debugPanel" aria-live="off">
      <div className="debugPanel-title">{target.title}</div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="debugPanel-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
