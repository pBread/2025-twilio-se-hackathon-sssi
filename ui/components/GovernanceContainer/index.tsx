import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import startCase from "lodash.startcase";
import { useRouter } from "next/router";
import { useState } from "react";

export function GovernanceContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  const governance = call?.callContext?.governance;

  const [closed, setClosed] = useState({});
  const toggle = (value: string) =>
    setClosed((state) => ({ ...state, [value]: !state[value] }));

  const data = !call?.callContext?.governance
    ? []
    : Object.entries(governance)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([procedureId, steps]) => ({
          value: procedureId,
          label: startCase(procedureId),
          children: steps.map((step) => ({
            value: step.id,
            label: startCase(step.id),
            status: step.status,
          })),
        }));

  return (
    <div>
      {data.map((parent) => (
        <div key={`s82-${parent.value}`}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              cursor: "pointer",
            }}
            onClick={() => toggle(parent.value)}
          >
            {closed[parent.value] ? (
              <IconPlus size={12} />
            ) : (
              <IconMinus size={12} />
            )}
            <Text fw="bold">{parent.label}</Text>
          </div>

          {!closed[parent.value] &&
            parent.children.map((child) => (
              <div
                key={`849-${parent.value}-${child.value}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingLeft: "24px",
                }}
              >
                <Text> {child.label}</Text>
                <Text> {child.status}</Text>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
