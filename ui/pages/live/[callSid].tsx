import { GovernanceContainer } from "@/components/GovernanceContainer";
import { RecallContainer } from "@/components/RecallContainer";
import { TurnsTable } from "@/components/TurnsTable";
import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { useCallLogs } from "@/state/logs";
import { useCallQuestions } from "@/state/questions";
import { Badge, Button, Paper, Table, Text, Title } from "@mantine/core";
import { LogActions } from "@shared/entities";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LiveCall() {
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
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const [showSystem, setShowSystem] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Paper
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
        className="paper"
      >
        <Title order={3}>Conscious Bot</Title>
      </Paper>

      <Paper className="paper">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Title order={4}>Turns</Title>
          <Button
            onClick={() => setShowSystem(!showSystem)}
            size="sm"
            variant="default"
          >
            {showSystem ? "Hide System" : "Show System"}
          </Button>
        </div>
        <div style={{ height: "400px", overflow: "scroll" }}>
          <TurnsTable callSid={callSid} showSystem={showSystem} />
        </div>
      </Paper>

      <Paper className="paper">
        <Title order={4}>Calibrations</Title>
        <div style={{ height: "400px", overflow: "scroll" }}>
          <CalibrationsContainer />
        </div>
      </Paper>
    </div>
  );
}

function CalibrationsContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const logs = useCallLogs(callSid);

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Source</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {logs.map((item) => (
          <Table.Tr key={`sw4-${item.id}`}>
            <Table.Td>{item.source}</Table.Td>
            <Table.Td>{item.description}</Table.Td>
            <Table.Td
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                width: "max-content",
              }}
            >
              {[...item.actions]
                .sort((a, b) => a.localeCompare(b))
                .map((action) => (
                  <ActionBadge
                    action={action}
                    key={`s28-${item.id}-${action}`}
                  />
                ))}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function ActionBadge({ action }: { action: LogActions }) {
  let color = ""; // https://mantine.dev/core/badge/

  if (action === "Approval") color = "green";
  if (action === "Rejection") color = "red";
  // if (action === "Added System Message") color = "indigo";
  // if (action === "Updated Context") color = "teal";
  if (action === "Updated Instructions") color = "gray";

  return <Badge color={color}>{action} </Badge>;
}

function Subconsciousness() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Paper className="paper">
        <Title order={3}>Subconscious Bots</Title>
      </Paper>
      <Paper className="paper">
        <Title order={4}>Conversation Recall</Title>
        <Title order={6}>Most Similar Conversations</Title>
        <RecallContainer />
      </Paper>
      <Paper className="paper">
        <Title order={4}>Discussion with Human Agent</Title>
        <HumanInput />
      </Paper>
      <Paper className="paper">
        <Title order={4}>Procedure Governance</Title>
        <div style={{ height: "300px", overflow: "scroll" }}>
          <GovernanceContainer />
        </div>
      </Paper>

      <Paper className="paper">
        <Title order={4}>Call Summary</Title>
        <CallSummary />
      </Paper>
    </div>
  );
}

function HumanInput() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const questions = useCallQuestions(callSid);

  return (
    <div>
      {!questions?.length && (
        <Text size="sm"> AI hasn't asked a human agent for help. </Text>
      )}
      {questions.map((question) => (
        <div key={`${router.asPath}-8s8-${callSid}`}>
          <Question
            answer={question.answer}
            callSid={question.callSid}
            explanation={question.explanation}
            question={question.question}
            recommendation={question.recommendation}
            status={question.status}
          />
        </div>
      ))}
    </div>
  );
}

function Question({
  answer,
  callSid,
  explanation,
  question,
  recommendation,
  status,
}: {
  answer: string;
  callSid: string;
  explanation: string;
  question: string;
  recommendation: string;
  status: "new" | "approved" | "rejected";
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <IconMinus size={12} /> : <IconPlus size={12} />}
        <Text size="sm" style={{ flex: 1 }}>
          <b>AI Question: </b> {question}
        </Text>

        <Badge
          color={
            status === "approved"
              ? "green"
              : status === "rejected"
              ? "red"
              : "blue"
          }
        >
          {status}
        </Badge>
      </div>
      {isOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            paddingLeft: "12px",
          }}
        >
          <Text size="sm">{explanation}</Text>
          <Text size="sm">{recommendation}</Text>
          <Text size="sm">
            <b>Human Answer: </b> {answer}
          </Text>
        </div>
      )}
    </>
  );
}

function CallSummary() {
  const router = useRouter();
  const callSid = router.query.callSid as string;
  const summary = useAppSelector(
    (state) => selectCallById(state, callSid)?.summary
  );

  let description = summary?.description?.substring(0, 400);

  return (
    <div>
      <Text fw="bold">{summary?.title}</Text>
      <Text size="xs">
        {description} {summary?.description?.length > 400 && <span>...</span>}
      </Text>
      {!!summary?.customerDetails?.length && (
        <ul>
          {summary?.customerDetails?.map((detail) => (
            <li key={`${router.asPath}-${detail}-492m`}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
