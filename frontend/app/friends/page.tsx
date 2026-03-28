import { Suspense } from "react";
import FriendsPageContent from "./friends-content";

export default function FriendsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#0A0F1A]" />}>
      <FriendsPageContent />
    </Suspense>
  );
}
