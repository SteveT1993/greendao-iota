import { useRouter } from 'next/router';
import GoalPage from '../../dao/goal/index';

// Modern route: /daos/[daoId]/goals/[goalId] (e.g., /daos/0/goals/1)
export default function GoalIdRoute() {
  return <GoalPage />;
}
