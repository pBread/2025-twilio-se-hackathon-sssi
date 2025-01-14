import { selectCallById, selectCallIds } from "@/state/calls";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  fetchCallMessages,
  getMessageById,
  selectCallMessageIds,
} from "@/state/messages";
import { useEffect } from "react";

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
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCallMessages(callSid));
  }, [callSid]);

  const msgIds = useAppSelector((state) =>
    selectCallMessageIds(state, callSid)
  );

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
    <div style={{ paddingLeft: "5px" }}>
      Id: {msg.id} -- Role: {msg.role} -- seq {msg._index}
    </div>
  );
}
