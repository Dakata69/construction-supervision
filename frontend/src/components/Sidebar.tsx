// frontend/src/components/Sidebar.tsx
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function Sidebar() {
  const isAdmin = useSelector((s: RootState) => s.auth.isAdmin);
  return (
    <aside className="sidebar">
      <ul>
        {isAdmin && (
          <>
            <li><a href="/admin">Админ панел</a></li>
            <li>Управление на роли</li>
            <li>Натовареност на екипи</li>
          </>
        )}
      </ul>
    </aside>
  );
}
