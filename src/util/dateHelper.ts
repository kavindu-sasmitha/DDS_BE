/**
 * Calculates the practical training start date by adding exactly 2 months to the theory exam date.
 * @param examDate The date of the theory examination
 */
export const calculatePracticalDate = (examDate: Date): Date => {
  const practicalDate = new Date(examDate);
  practicalDate.setMonth(practicalDate.getMonth() + 2);
  return practicalDate;
};
