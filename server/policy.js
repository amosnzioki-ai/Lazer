export const roles = {
  super_admin: [
    "employees",
    "leave",
    "records",
    "audit",
    "settings",
    "reports",
  ],
  hr: ["employees", "leave", "records", "audit", "reports"],
  school_admin: ["employees", "leave", "records", "reports"],
  principal: ["employees", "leave", "records", "reports"],
  manager: ["employees", "leave", "records", "reports"],
  finance: ["employees", "records", "reports"],
  recruiter: ["records"],
  employee: ["leave", "records"],
  enko: ["reports"],
};
export function permits(user, resource) {
  return !!roles[user?.role]?.includes(resource);
}
export function scoped(user) {
  return ["school_admin", "principal", "manager", "employee"].includes(
    user.role,
  );
}
export function weekdays(start, end) {
  let count = 0;
  for (
    let d = new Date(start + "T00:00:00Z");
    d <= new Date(end + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1)
  )
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) count++;
  return count;
}
