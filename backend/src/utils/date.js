export const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const isPastDate = (date) => {
  if (!date) return false;
  return new Date(date) < startOfToday();
};

export const overdueFilter = () => ({
  dueDate: { $lt: startOfToday() },
  status: { $ne: "Completed" }
});
