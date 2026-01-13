export const getPlanLevel = (plan) => {
  if (plan === 'Platinum') return 3;
  if (plan === 'Premium') return 2;
  if (plan === 'Basic') return 1;
  return 0; // Free
};
