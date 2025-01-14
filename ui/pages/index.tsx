import { selectCallById, selectCallIds } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallMessageIds, getMessageById } from "@/state/messages";
import Link from "next/link";

export default function Home() {
  const callIds = useAppSelector(selectCallIds);

  return (
    <div>
      Home
      <div>
        Calls
        {callIds.map((id) => (
          <CallDisplay callSid={id} key={`call-diplay-${id}`} />
        ))}
      </div>
    </div>
  );
}

function CallDisplay({ callSid }: { callSid: string }) {
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <>
      <div style={{ paddingLeft: "5px" }}>
        <b>Call Sid:</b> <Link href={`/calls/${callSid}`}>{call.callSid}</Link>{" "}
        <b>From:</b> {call.from} <b>To:</b> {call.to}
        <br />
        {call.createdAt}
      </div>
      <br />
    </>
  );
}
