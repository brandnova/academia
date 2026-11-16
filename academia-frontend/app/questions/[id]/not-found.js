// app/questions/[id]/not-found.js
export default function QuestionNotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-xl font-semibold mb-2">Question not found</h1>
      <p className="text-muted">
        This question may have been removed, or the link is incorrect.
      </p>
    </div>
  );
}