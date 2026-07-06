import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  previousHref?: string;
  nextHref?: string;
  className?: string;
};

export function TablePagination({
  page,
  totalPages,
  onPrevious,
  onNext,
  previousHref,
  nextHref,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const showPrev = page > 1;
  const showNext = page < totalPages;

  return (
    <div className={cn("flex items-center justify-between gap-4 pt-1", className)}>
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {showPrev ? (
          onPrevious ? (
            <Button variant="outline" size="sm" onClick={onPrevious}>
              Previous
            </Button>
          ) : previousHref ? (
            <Link href={previousHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Previous
            </Link>
          ) : null
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {showNext ? (
          onNext ? (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next
            </Button>
          ) : nextHref ? (
            <Link href={nextHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next
            </Link>
          ) : null
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
