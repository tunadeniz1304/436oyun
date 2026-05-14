/** @param {{ onClose: () => void }} props */
export default function RetroDocsFolder({ onClose }) {
  return (
    <div style={{ padding: '16px', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontSize: '12px' }}>
      <p>Coming soon.</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
