// frontend/src/components/EmployeeCard.tsx
type Props = { employee: any };
export default function EmployeeCard({ employee }: Props) {
  const { user, photo, position, bio } = employee;
  return (
    <div className="employee-card">
      <img src={photo || '/placeholder-avatar.png'} alt={user?.first_name} />
      <div>
        <h4>{user?.first_name} {user?.last_name}</h4>
        <p>{position}</p>
        <small>{bio}</small>
      </div>
    </div>
  );
}
