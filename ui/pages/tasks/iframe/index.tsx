import { TaskApproverTable } from "@/components/TaskApproverTable";

export default function TaskContainer() {
  return (
    <>
      <TaskApproverTable />
      <style jsx global>{`
        body {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
      `}</style>
    </>
  );
}
