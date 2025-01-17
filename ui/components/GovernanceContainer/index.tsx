import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import startCase from "lodash.startcase";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

export function GovernanceContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const [closed, setClosed] = useState({});
  const previousStepsRef = useRef({});

  const toggle = (value) => {
    setClosed((state) => ({ ...state, [value]: !state[value] }));
  };
  const call = useAppSelector((state) => selectCallById(state, callSid));

  const governance = call?.callContext?.governance;

  const data = !governance
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

  // Track status changes
  useEffect(() => {
    const currentSteps = {};
    data.forEach((parent) => {
      parent.children.forEach((child) => {
        const key = `${parent.value}-${child.value}`;
        currentSteps[key] = child.status;
      });
    });

    // Compare with previous steps and add highlight class
    const statusElements = document.querySelectorAll("[data-status-element]");
    statusElements.forEach((element) => {
      const key = element.getAttribute("data-key");
      if (previousStepsRef.current[key] !== currentSteps[key]) {
        element.classList.add("status-highlight");
        setTimeout(() => {
          element.classList.remove("status-highlight");
        }, 500);
      }
    });

    previousStepsRef.current = currentSteps;
  }, [data]);

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
                <Text>{child.label}</Text>
                <Text
                  data-status-element
                  data-key={`${parent.value}-${child.value}`}
                  style={{
                    borderRadius: "0.25rem",
                    padding: "0 0.25rem",
                    transition: "background-color 0.5s",
                  }}
                >
                  {child.status}
                </Text>
              </div>
            ))}
        </div>
      ))}

      <style jsx global>{`
        .status-highlight {
          background-color: rgb(209 213 219);
          border-radius: 0.25rem;
          padding: 0 0.25rem;
        }
      `}</style>
    </div>
  );
}
