// import { useState } from 'react';

// export default function Home() {
//   const [ref, setRef] = useState('');
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   async function handleTrack() {
//     setResult(null);
//     setError('');

//     try {
//       const res = await fetch(`/api/track?referenceNumber=${encodeURIComponent(ref)}`);
//       const data = await res.json();
//       if (!res.ok) setError(data.error || 'Server error');
//       else setResult(data);
//     } catch (e) {
//       setError(e.message);
//     }
//   }

//   return (
//     <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
//       <h1>UPS Reference Tracking</h1>
//       <input
//         type="text"
//         value={ref}
//         onChange={e => setRef(e.target.value)}
//         placeholder="Enter Reference Number"
//         style={{ padding: '.5rem', width: '300px' }}
//       />
//       <button onClick={handleTrack} style={{ marginLeft: '1rem', padding: '.5rem 1rem' }}>
//         Track
//       </button>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
      
//       {result && <pre style={{ background: '#f0f0f0', padding: '1rem', marginTop: '1rem' }}>{JSON.stringify(result, null, 2)}</pre>}
//     </div>
//   );
// }


import { useState } from 'react';
import { parse, format } from 'date-fns';

export default function Home() {
  const [ref, setRef] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleTrack() {
    setResult(null);
    setError('');

    try {
      const res = await fetch(`/api/track?referenceNumber=${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Server error');
      } else {
        // ← extract only what we need
        const activity = data
          .trackResponse
          .shipment?.[0]
          .package?.[0]
          .activity?.[0];

        if (!activity) {
          setError('No activity found');
          return;
        }

        const dt = parse(
            `${activity.date}${activity.time}`,   // e.g. "20250425100510"
            'yyyyMMddHHmmss',
            new Date()
          );
          const nice = format(dt, 'Pp');  

        setResult({
          city: activity.location.address.city,
          state: activity.location.address.stateProvince,
          country: activity.location.address.country,
          statusDescription: activity.status.description.trim(),
          statusCode: activity.status.statusCode,
          datetime: nice,
        });
      }
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>UPS Reference Tracking</h1>
      <input
        type="text"
        value={ref}
        onChange={e => setRef(e.target.value)}
        placeholder="Enter Reference Number"
        style={{ padding: '.5rem', width: '300px' }}
      />
      <button onClick={handleTrack} style={{ marginLeft: '1rem', padding: '.5rem 1rem' }}>
        Track
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem' }}>
          <p><strong>City:</strong> {result.city}, {result.state} ({result.country})</p>
          <p><strong>Status:</strong> {result.statusDescription}</p>
          <p><strong>Timestamp:</strong> {result.datetime}</p>
        </div>
      )}
    </div>
  );
}
