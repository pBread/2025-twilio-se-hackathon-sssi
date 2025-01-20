"use client";
import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { Loader, Paper } from "@mantine/core";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const JsonEditor = dynamic(
  () => import("json-edit-react").then(({ JsonEditor }) => JsonEditor),
  { ssr: false, loading: () => <Loader /> }
);

export default function Debug() {
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "flex" }}>
        <Paper className="paper">
          <CallData />
        </Paper>
      </div>
    </div>
  );
}

function CallData() {
  const router = useRouter();
  const callSid = router.query.callSid as string;
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <JsonEditor
      data={call}
      keySort={(a, b) => {
        if (typeof call[a] === "object") return 1;
        if (typeof call[b] === "object") return -1;
        return a.localeCompare(b);
      }}
      collapse
      rootName="Call Record"
      setData={(...args: any[]) => {
        console.debug("jsoneditor args", ...args);
      }}
    />
  );
}
