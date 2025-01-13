import { selectCallById, selectCallIds } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";

export default function Home() {
  const callIds = useAppSelector(selectCallIds);

  return (
    <div>
      Home
      <div>
        Calls
        {callIds.map((callId) => (
          <CallDisplay callId={callId} key={`call-diplay-${callId}`} />
        ))}
      </div>
    </div>
  );
}

function CallDisplay({ callId }: { callId: string }) {
  const call = useAppSelector((state) => selectCallById(state, callId));

  return (
    <div>
      Call Sid: {call.callSid}
      <br />
      From: {call.from}
    </div>
  );
}
