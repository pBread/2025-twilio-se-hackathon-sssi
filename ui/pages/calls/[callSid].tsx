import { useRouter } from "next/router";

export default function LiveCall(props) {
  const router = useRouter();

  const callSid = router.query.callSid as string;
  console.log("CallProps", props);
  return (
    <div>
      Home
      <div>Call: {callSid}</div>
    </div>
  );
}
