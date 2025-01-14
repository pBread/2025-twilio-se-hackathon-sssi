import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { Paper, Skeleton, Text } from "@mantine/core";
import { useRouter } from "next/router";

export default function LiveCall() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  return <div></div>;
}
