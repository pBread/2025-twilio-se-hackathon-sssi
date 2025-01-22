import { TaskApproverTable } from "@/components/TaskApproverTable";
import { useRouter } from "next/router";

export default function TaskContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  return (
    <>
      <TaskApproverTable callSid={callSid} />
      <style jsx global>{`
        body {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
      `}</style>
    </>
  );
}
