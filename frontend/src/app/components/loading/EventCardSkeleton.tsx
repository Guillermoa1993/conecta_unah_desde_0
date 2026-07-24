import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#004B87] to-[#003366] text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4 bg-white/20" />
            <Skeleton className="h-4 w-1/2 bg-white/20" />
          </div>
          <Skeleton className="h-6 w-20 bg-white/20" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-32" />
      </CardContent>
      <CardFooter className="bg-secondary p-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
