
// TODO(vadim): Replace all usage of <i> for icons with this component
export default function Icon({ icon }) {
  return (
    <i className={`bi bi-${icon}`}></i>
  );
}