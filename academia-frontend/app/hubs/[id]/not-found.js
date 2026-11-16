// app/hubs/[id]/not-found.js
export default function HubNotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-xl font-semibold mb-2">Hub not found</h1>
      <p className="text-muted">
        This hub may not exist yet, or the link is incorrect.
      </p>
    </div>
  );
}