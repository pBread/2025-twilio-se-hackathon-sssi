import { Paper, Title } from "@mantine/core";
import { useRouter } from "next/router";

export default function LiveCall() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <div style={{ flex: 2 }}>
        <Conscious />
      </div>
      <div style={{ flex: 1 }}>
        <Subconsciousness />
      </div>
    </div>
  );
}

function Conscious() {
  return (
    <Paper>
      <Title order={3}>Consciousness</Title>
    </Paper>
  );
}

function Subconsciousness() {
  return (
    <Paper>
      <Title order={3}>Subconsciousness</Title>
    </Paper>
  );
}
