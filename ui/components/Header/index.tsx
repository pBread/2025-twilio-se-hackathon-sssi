import { useSyncSlice } from "@/state/sync";
import { Loader } from "@mantine/core";

export function Header() {
  return (
    <header>
      <img className="header-logo" alt="logo" src={"/logo.png"} />

      <div className="header-section"></div>

      <div className="header-section">
        <Connection />
      </div>
    </header>
  );
}

function Connection() {
  const syncSlice = useSyncSlice();

  if (syncSlice.connectionState === "connected") return;

  return <Loader size="sm" />;
}
