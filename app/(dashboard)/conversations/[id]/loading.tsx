import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl flex flex-col h-full gap-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex-1 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 rounded-xl"
            style={{ marginLeft: i % 2 === 0 ? "0" : "auto", maxWidth: "70%" }}
          />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}
