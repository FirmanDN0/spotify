fetch('http://localhost:3000/api/music/stream?id=JGwWNGJdvx8')
  .then(res => {
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Content-Length:', res.headers.get('content-length'));
    if (!res.ok) return res.json().then(d => console.log('Error body:', d));
    console.log('SUCCESS - Audio stream is working!');
  })
  .catch(console.error);
