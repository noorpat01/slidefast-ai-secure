// Simple function to serve Slidefast AI website
Deno.serve((req) => {
  console.log(`🔍 Simple Index function - URL: ${req.url}, method: ${req.method}`);
  
  // Always serve the HTML (no authentication, no path checking)
  console.log(`🌐 Serving HTML for any request`);
  
  if (true) { // Always true - serve HTML for any request
    return new Response(
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Slidefast AI - Create Amazing Presentations</title>
  <link rel="icon" type="image/svg+xml" href="https://dl4quu77k06i.space.minimax.io/vite.svg" />
  <script type="module" crossorigin src="https://dl4quu77k06i.space.minimax.io/assets/index-Bj5kgsv4.js"></script>
  <link rel="stylesheet" crossorigin href="https://dl4quu77k06i.space.minimax.io/assets/index-DmrOKNDg.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
