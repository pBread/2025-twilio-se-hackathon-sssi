"use client";
import { selectCallById, setOneCall } from "@/state/calls";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { getCallLogs, getLogEntities, setManyLogs } from "@/state/logs";
import {
  getCallMessages,
  getMessageEntities,
  setManyMessages,
} from "@/state/messages";
import {
  getCallQuestions,
  selectQuestionEntities,
  setManyQuestions,
} from "@/state/questions";
import { Button, Loader, Paper, Tabs, Title } from "@mantine/core";
import type {
  AIQuestion,
  CallRecord,
  LogRecord,
  StoreMessage,
} from "@shared/entities";
import { diff } from "deep-diff";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";

const JsonEditor = dynamic(
  () => import("json-edit-react").then(({ JsonEditor }) => JsonEditor),
  { ssr: false, loading: () => <Loader /> }
);

export default function Debug() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Paper
        className="paper"
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <Title order={3}>Call Data</Title>
        <DataActions />
      </Paper>
      <Paper className="paper">
        <Tabs defaultValue="call">
          <Tabs.List>
            <Tabs.Tab value="call">Call</Tabs.Tab>
            <Tabs.Tab value="messages">Messages</Tabs.Tab>
            <Tabs.Tab value="questions">Questions</Tabs.Tab>
            <Tabs.Tab value="logs">Logs</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="call">
            <CallData />
          </Tabs.Panel>
          <Tabs.Panel value="messages">
            <CallMessages />
          </Tabs.Panel>
          <Tabs.Panel value="questions">
            <CallQuestions />
          </Tabs.Panel>
          <Tabs.Panel value="logs">
            <CallLogs />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </div>
  );
}

function DataActions() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const [status, setStatus] = useState<string>();

  const call = useAppSelector((state) => selectCallById(state, callSid));
  const messages = useAppSelector((state) => getCallMessages(state, callSid));
  const logs = useAppSelector((state) => getCallLogs(state, callSid));
  const questions = useAppSelector((state) => getCallQuestions(state, callSid));

  function handleDownload() {
    const data = { call, messages, logs, questions };
    const jsonString = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${callSid}-data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}
    >
      {status === "loading" && <Loader />}
      {status === "error" && <div> ERROR </div>}

      {!status && (
        <Button
          color="red"
          onClick={async () => {
            setStatus("loading");

            try {
              await fetch(`/api/calls/${callSid}`, { method: "DELETE" });
              setStatus(null);
              router.push("/");
            } catch (error) {
              setStatus("error");
            }
          }}
        >
          Delete
        </Button>
      )}
      <Button onClick={handleDownload}>Download</Button>
      {status === "loading" && <Loader />}
      {status === "error" && <div> ERROR </div>}

      {!status && (
        <Button
          color={status === "error" ? "red" : "green"}
          onClick={async () => {
            setStatus("loading");

            try {
              await fetch(`/api/calls/${callSid}/save`, {
                method: "POST",
                body: JSON.stringify({ call, messages, logs, questions }),
              });

              setStatus(null);
            } catch (error) {
              console.error("Error on save", error);
              throw error;
            }
          }}
        >
          Save
        </Button>
      )}
    </div>
  );
}

function CallData() {
  const router = useRouter();
  const callSid = router.query.callSid as string;
  const call = useAppSelector((state) => selectCallById(state, callSid));

  const dispatch = useAppDispatch();

  return (
    <JsonEditor
      minWidth="100%"
      data={call}
      keySort={(a, b) => {
        if (typeof call[a] === "object") return 1;
        if (typeof call[b] === "object") return -1;
        return a.localeCompare(b);
      }}
      collapse={(item) => {
        return !item.key;
      }}
      rootName="Call Record"
      setData={(call: CallRecord) => {
        dispatch(setOneCall(call));
      }}
    />
  );
}

function CallMessages() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const msgs = useAppSelector((state) => getCallMessages(state, callSid));
  const msgMap = useAppSelector(getMessageEntities);

  const dispatch = useAppDispatch();

  return (
    <JsonEditor
      minWidth="100%"
      data={msgs}
      rootName="Messages"
      setData={(msgs: StoreMessage[]) => {
        const msgsToUpdate = msgs.filter((msg) => diff(msg, msgMap[msg.id]));
        dispatch(setManyMessages(msgsToUpdate));
      }}
    />
  );
}

function CallQuestions() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const questions = useAppSelector((state) => getCallQuestions(state, callSid));
  const entityMap = useAppSelector(selectQuestionEntities);

  const dispatch = useAppDispatch();

  return (
    <JsonEditor
      minWidth="100%"
      data={questions}
      rootName="Questions"
      setData={(items: AIQuestion[]) => {
        const updates = items.filter((item) => diff(item, entityMap[item.id]));
        dispatch(setManyQuestions(updates));
      }}
    />
  );
}

function CallLogs() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const logs = useAppSelector((state) => getCallLogs(state, callSid));
  const entityMap = useAppSelector(getLogEntities);

  const dispatch = useAppDispatch();

  return (
    <JsonEditor
      minWidth="100%"
      data={logs}
      rootName="Logs"
      setData={(items: LogRecord[]) => {
        const updates = items.filter((item) => diff(item, entityMap[item.id]));
        dispatch(setManyLogs(updates));
      }}
    />
  );
}
