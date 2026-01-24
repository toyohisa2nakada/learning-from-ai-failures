// app/page.tsx
import { redirect } from "next/navigation";
import { CHAPTERS } from "@/constants/chapters";

export default function Home() {
  redirect(`/chapter/${CHAPTERS[0]}`);
}
