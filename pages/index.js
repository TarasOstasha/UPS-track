// JSON
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

// PARSED JSON
// import { useState } from 'react';
// import { parse, format } from 'date-fns';

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
//       if (!res.ok) {
//         setError(data.error || 'Server error');
//       } else {
//         // ← extract only what we need
//         const activity = data
//           .trackResponse
//           .shipment?.[0]
//           .package?.[0]
//           .activity?.[0];

//         if (!activity) {
//           setError('No activity found');
//           return;
//         }

//         const dt = parse(
//             `${activity.date}${activity.time}`,   // e.g. "20250425100510"
//             'yyyyMMddHHmmss',
//             new Date()
//           );
//           const nice = format(dt, 'Pp');

//         setResult({
//           city: activity.location.address.city,
//           state: activity.location.address.stateProvince,
//           country: activity.location.address.country,
//           statusDescription: activity.status.description.trim(),
//           statusCode: activity.status.statusCode,
//           datetime: nice,
//         });
//       }
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

//       {result && (
//         <div style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem' }}>
//           <p><strong>City:</strong> {result.city}, {result.state} ({result.country})</p>
//           <p><strong>Status:</strong> {result.statusDescription}</p>
//           <p><strong>Timestamp:</strong> {result.datetime}</p>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from 'react';
import { parse, format } from 'date-fns';

export default function Home() {
  const [ref, setRef] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleTrack() {
    setResult(null);
    setError('');
    setLoading(true);

    const trackingNumbers = ref
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const results = [];

    for (const tn of trackingNumbers) {
      try {
        const res = await fetch(
          `/api/track?referenceNumber=${encodeURIComponent(tn)}`
        );
        const data = await res.json();

        if (!res.ok || !data?.trackResponse) {
          results.push({
            trackingNumber: tn,
            error: data.error || 'Tracking failed',
          });
          continue;
        }

        const shipment = data.trackResponse.shipment?.[0];
        const pkg = shipment?.package?.[0];
        const activity = pkg?.activity?.[0];

        if (!activity) {
          results.push({ trackingNumber: tn, error: 'No activity found' });
          continue;
        }

        const dt = parse(
          `${activity.date}${activity.time}`,
          'yyyyMMddHHmmss',
          new Date()
        );
        const nice = format(dt, 'Pp');

        results.push({
          trackingNumber: tn,
          city: activity.location.address.city,
          state: activity.location.address.stateProvince || '',
          country: activity.location.address.country || '',
          statusDescription: activity.status.description.trim(),
          statusCode: activity.status.statusCode,
          datetime: nice,
          service: pkg?.service?.description || 'N/A',
        });
      } catch (e) {
        results.push({ trackingNumber: tn, error: e.message });
      }
    }

    setResult(results);
    setLoading(false);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>UPS Reference Tracking</h1>

      <textarea
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="Paste tracking numbers (one per line)"
        rows={10}
        style={{ padding: '.5rem', width: '100%', maxWidth: '600px' }}
      />

      <button
        onClick={handleTrack}
        disabled={loading}
        style={{
          marginTop: '1rem',
          padding: '.5rem 1rem',
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Tracking...' : 'Track'}
      </button>

      {loading && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ marginBottom: '.5rem', fontWeight: 'bold' }}>
            In Progress...
          </p>
          <div
            style={{
              height: '6px',
              backgroundColor: '#ccc',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(to right, #4caf50 30%, #81c784 60%, #4caf50 90%)',
                backgroundSize: '200% auto',
                animation: 'loading-bar 1s linear infinite',
              }}
            />
            <style jsx>{`
              @keyframes loading-bar {
                0% {
                  background-position: -100% 0;
                }
                100% {
                  background-position: 100% 0;
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {Array.isArray(result) &&
        result.map((item, index) => (
          <div
            key={index}
            style={{
              marginTop: '1rem',
              background: item.statusCode === '011' ? '#d0f0d0' : '#f0f0f0',
              padding: '1rem',
            }}
          >
            <p>
              <strong>Tracking #:</strong>{' '}
              <a
                href={`https://www.ups.com/track?tracknum=${item.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0070f3', textDecoration: 'underline' }}
              >
                {item.trackingNumber}
              </a>
            </p>

            {item.error ? (
              <p style={{ color: 'red' }}>
                <strong>Error:</strong> {item.error}
              </p>
            ) : (
              <>
                <p>
                  <strong>City:</strong> {item.city}, {item.state} (
                  {item.country})
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    style={{
                      color: item.statusCode !== '011' ? 'red' : 'inherit',
                    }}
                  >
                    {item.statusDescription}
                  </span>
                </p>
                <p>
                  <strong>Timestamp:</strong> {item.datetime}
                </p>
                <p>
                  <strong>Service:</strong> {item.service}
                </p>
              </>
            )}
          </div>
        ))}
    </div>
  );
}

