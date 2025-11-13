import { useRouter } from 'next/router';
import DaoPage from './dao/index';

// Modern route: /daos/[daoId] (e.g., /daos/0)
// Redirects to the old component with router params
export default function DaoIdRoute() {
  return <DaoPage />;
}
