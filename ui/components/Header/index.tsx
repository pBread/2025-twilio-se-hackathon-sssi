import { useSyncSlice } from "@/state/sync";
import { Text } from "@mantine/core";

export function Header() {
  const syncSlice = useSyncSlice();

  return (
    <header>
      <div className="header-section"></div>

      <img className="header-logo" alt="logo" src={"/logo.png"} />

      <div className="header-section">
        <Text size="sm">Sync: {syncSlice.connectionState}</Text>
      </div>
    </header>
  );
}
