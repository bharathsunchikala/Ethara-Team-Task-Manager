import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-sm">
      <p className="text-slate-500">
        Page {pagination.page} of {pagination.pages} · {pagination.total} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
