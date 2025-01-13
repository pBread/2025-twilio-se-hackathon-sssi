import { useSyncSlice } from "@/state/sync";

export function Header() {
  const syncSlice = useSyncSlice();

  return (
    <div>
      <div>Sync Connection State {syncSlice.connectionState}</div>
    </div>
  );
}
