export function TaskApprover({ callSid }) {
  let src = callSid
    ? `http://localhost:3002/tasks/iframe/${callSid}`
    : `http://localhost:3002/tasks/iframe`;

  return (
    <iframe height="100%" src={src} style={{ border: "none" }} width="100%" />
  );
}
