import { selectCallById, selectCallIds } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getMessageById, useCallMessageIds } from "@/state/messages";

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
    <div style={{ paddingLeft: "5px" }}>
      Call Sid: {call.callSid}
      <br />
      From: {call.from}
      <CallMessages callSid={callSid} />
    </div>
  );
}

function CallMessages({ callSid }: { callSid: string }) {
  const msgIds = useCallMessageIds(callSid);

  return (
    <div style={{ paddingLeft: "5px" }}>
      Call Messages <br />
      {msgIds.map((msgId) => (
        <CallMessage msgId={msgId} key={`${callSid}-${msgId}`} />
      ))}
    </div>
  );
}

function CallMessage({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) => getMessageById(state, msgId));

  return (
    <div>
      Id: {msg.id}
      <br />
      Role: {msg.role}
    </div>
  );
}
