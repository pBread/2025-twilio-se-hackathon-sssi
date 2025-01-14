const moToMonth = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthName(month: number) {
  console.log(`month ${month}, name: ${moToMonth[month]}`);
  return moToMonth[month];
}
