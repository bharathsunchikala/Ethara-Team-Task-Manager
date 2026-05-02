export const formatDate = (date) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
};

export const isOverdue = (date, status) => {
  if (!date || status === "Completed") return false;
  const due = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export const todayInputValue = () => new Date().toISOString().split("T")[0];
