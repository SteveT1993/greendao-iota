import { useRouter } from 'next/router';
import IdeasPage from '../../../../dao/goal/ideas/index';

// Modern route: /daos/[daoId]/goals/[goalId]/ideas/[ideaId] (e.g., /daos/0/goals/1/ideas/2)
export default function IdeaIdRoute() {
  return <IdeasPage />;
}
