import { selectCallById, setOneCall } from "@/state/calls";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { getCallMessages, getMessageById } from "@/state/messages";
import { makeId } from "@/util/misc";
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Loader,
  Paper,
  Radio,
  Table,
  Textarea,
} from "@mantine/core";
import { Annotation, BotMessage, HumanMessage } from "@shared/entities";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";

const paperStyle = { padding: "6px" };

type SetFeedbackId = Dispatch<SetStateAction<string>>;

export default function CallReview() {
  const [feedbackId, setFeedbackId] = useState<string>(null);

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <div style={{ flex: 2 }}>
        <Paper style={paperStyle}>
          <TurnTable feedbackId={feedbackId} />
        </Paper>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Feedback feedbackId={feedbackId} setFeedbackId={setFeedbackId} />
      </div>
    </div>
  );
}

function Feedback({
  feedbackId,
  setFeedbackId,
}: {
  feedbackId: string;
  setFeedbackId: SetFeedbackId;
}) {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  const createNewFeedback = useCreateFeedback(callSid, setFeedbackId);

  const { saveCall, status } = useSaveCall(callSid);

  return (
    <>
      <div style={{ display: "flex", width: "100%", gap: "10px" }}>
        <Button onClick={createNewFeedback} style={{ flex: 1 }}>
          New Annotation
        </Button>
        <Button onClick={saveCall} style={{ flex: 1 }}>
          Save
          {status === "in-progress" && <Loader />}
        </Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {call?.feedback.map((item) => (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Checkbox
              checked={feedbackId === item.id}
              onClick={() =>
                setFeedbackId(feedbackId === item.id ? null : item.id)
              }
              onChange={() => {}}
            />
            <FeedbackCard
              key={`${callSid}-di-${item.id}`}
              callSid={callSid}
              comment={item.comment}
              feedbackId={item.id}
              isSelected={feedbackId === item.id}
              polarity={item.polarity}
              setFeedbackId={setFeedbackId}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function useSaveCall(callSid: string) {
  const call = useAppSelector((state) => selectCallById(state, callSid));

  const [status, setStatus] = useState<"in-progress" | "complete" | "error">(
    null
  );

  const saveCall = async () => {
    if (!call)
      return console.error(
        `Attempted to save call ${callSid} but no call found in store`
      );

    setStatus("in-progress");
    const res = await fetch(`/api/calls/${callSid}`, {
      method: "POST",
      body: JSON.stringify(call),
    });

    if (res.ok) setStatus("complete");
    else setStatus("error");

    setTimeout(() => setStatus(null), 500);
  };

  return { saveCall, status };
}

function FeedbackCard({
  callSid,
  comment,
  feedbackId,
  isSelected,
  polarity,
  setFeedbackId,
}: {
  callSid: string;
  comment: string;
  feedbackId: string;
  isSelected: boolean;
  polarity: "bad" | "neutral" | "good";
  setFeedbackId: SetFeedbackId;
}) {
  const setFeedback = useSetFeedback(callSid, feedbackId);

  return (
    <Paper
      style={{
        ...paperStyle,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: "auto",
        boxShadow: "var(--mantine-shadow-xs)",

        border: isSelected
          ? "1px solid var(--mantine-primary-color-1)"
          : "1px solid transparent",
      }}
    >
      <Textarea
        label="Feedback"
        description="This feedback will be provided voice bots who are having similar conversations"
        placeholder="..."
        value={comment}
        onChange={(ev) => setFeedback("comment", ev.target.value)}
      />
      <Group>
        <Radio checked={polarity === "bad"} label="Bad" value="bad" />
        <Radio
          checked={polarity === "neutral"}
          label="Neutral"
          value="neutral"
        />
        <Radio checked={polarity === "good"} label="Good" value="good" />
      </Group>
    </Paper>
  );
}

function useCreateFeedback(callSid: string, setFeedbackId: SetFeedbackId) {
  const dispatch = useAppDispatch();
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return () => {
    if (!call) return;

    const id = makeId();

    const feedback: Annotation = {
      id,
      comment: "",
      polarity: "neutral",
      targets: [],
    };

    dispatch(setOneCall({ ...call, feedback: call.feedback.concat(feedback) }));
    setFeedbackId(id);
  };
}

function useSetFeedback(callSid: string, feedbackId?: string) {
  const dispatch = useAppDispatch();
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return <K extends keyof Annotation>(property: K, value: Annotation[K]) => {
    if (!feedbackId) {
      return console.warn(
        "attempted to update feedback but no annotation selected"
      );
    }

    const map = new Map<string, Annotation>();
    for (const item of call.feedback) map.set(item.id, item);

    const feedbackItem = map.get(feedbackId);
    if (!feedbackItem) {
      return console.warn(
        "attempted to update feedback but annotation not found"
      );
    }

    // Update the specific property
    const updatedFeedback = {
      ...feedbackItem,
      [property]: value,
    };

    // Update the map and recreate the feedback array
    map.set(feedbackId, updatedFeedback);
    const newFeedback = Array.from(map.values());

    // Dispatch the update
    dispatch(
      setOneCall({
        ...call,
        feedback: newFeedback,
      })
    );
  };
}

function useSetTargets(callSid: string, feedbackId?: string) {
  const dispatch = useAppDispatch();
  const call = useAppSelector((state) => selectCallById(state, callSid));
  const feedbackItem = call?.feedback.find((item) => item.id === feedbackId);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );

  return (index: number, isShift: boolean) => {
    if (!call) return;
    if (!feedbackItem) {
      return console.warn(
        "attempted to set targets but no annotation selected"
      );
    }

    const map = new Map<string, Annotation>();
    for (const item of call.feedback) map.set(item.id, item);

    const currentTargets = new Set(feedbackItem.targets);

    if (isShift && lastSelectedIndex !== null) {
      // Handle range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);

      // If the last clicked item is selected, we're adding to the selection
      const isAdding = currentTargets.has(lastSelectedIndex);

      // Update all items in range
      for (let i = start; i <= end; i++) {
        if (isAdding) currentTargets.add(i);
        else currentTargets.delete(i);
      }
    } else {
      // Handle single selection toggle
      if (currentTargets.has(index)) currentTargets.delete(index);
      else currentTargets.add(index);

      setLastSelectedIndex(index);
    }

    // Update the feedback item with new targets
    const updatedFeedback = {
      ...feedbackItem,
      targets: Array.from(currentTargets).sort((a: number, b: number) => a - b),
    };

    // Update the map and recreate the feedback array
    map.set(feedbackId!, updatedFeedback);
    const newFeedback = Array.from(map.values());

    // Dispatch the update
    dispatch(setOneCall({ ...call, feedback: newFeedback }));
  };
}

function TurnTable({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const feedback = useAppSelector((state) => {
    const call = selectCallById(state, callSid);

    return call?.feedback?.find((item) => item.id === feedbackId);
  });

  const msgs = useAppSelector((state) =>
    getCallMessages(state, callSid).filter((msg) => msg.role !== "system")
  );

  const setTargets = useSetTargets(callSid, feedbackId);

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Role</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Content</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {msgs?.map((msg) => (
          <Table.Tr key={`di8-${msg.id}`} bg="">
            <Table.Td>
              <Checkbox
                checked={!!feedback && feedback.targets.includes(msg._index)}
                onClick={(ev) => setTargets(msg._index, ev.shiftKey)}
                onChange={() => {}}
              />
            </Table.Td>
            {msg.role === "bot" && <BotRow msgId={msg.id} />}
            {msg.role === "human" && <HumanRow msgId={msg.id} />}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function BotRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as BotMessage;

  let content = "";
  let isInterrupted = false;

  if (msg.type === "tool") {
    const tool = msg.tool_calls[0];
    content = `${tool.function.name}(${JSON.stringify(
      tool.function.arguments
    )})`.replaceAll("\\", "");
  } else {
    content = msg.content;
    isInterrupted = !!msg.interrupted;
  }

  return (
    <>
      <Table.Td>{msg.role}</Table.Td>
      <Table.Td>{msg.type}</Table.Td>
      <Table.Td>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "2px",
          }}
        >
          <span style={{ flex: 1 }}> {content}</span>
          <span>
            {isInterrupted && <Badge color="yellow">Interrupted</Badge>}
          </span>
        </div>
      </Table.Td>
    </>
  );
}

function HumanRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as HumanMessage;

  return (
    <>
      <Table.Td> {msg.role}</Table.Td>
      <Table.Td> {msg.type}</Table.Td>
      <Table.Td> {msg.content}</Table.Td>
    </>
  );
}
