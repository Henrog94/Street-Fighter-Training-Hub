
import useApiData from "../hooks/useApiData";

export default function DatabaseTest() {
  const {
    data: fighters,
    loading,
    error,
    retry
  } = useApiData("/api/fighters");

  if (loading) {
    return <p>Loading fighters from MongoDB...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Database request failed: {error}</p>
        <button onClick={retry}>Retry</button>
        <DatabaseTest />
      </div>
    );
  }

  return (
    <section className="database-test">
      <h2>MongoDB Connection Test</h2>

      <p>Fighters loaded: {fighters.length}</p>

      <ul>
        {fighters.map((fighter) => (
          <li key={fighter._id}>
            {fighter.name} — {fighter.moves?.length ?? 0} moves
          </li>
        ))}
      </ul>
    </section>
  );
}
