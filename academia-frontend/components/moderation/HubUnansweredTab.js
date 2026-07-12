export default function HubUnansweredTab({ hubId, isModerator }) {
  if (!isModerator) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You'll see this hub's unanswered questions once you're a moderator for
        it. As a representative, you can add yourself from the Moderators tab
        above.
      </p>
    );
  }

  return <UnansweredQueueInner hubId={hubId} />;
}

import UnansweredQueue from "./UnansweredQueue";
function UnansweredQueueInner({ hubId }) {
  return <UnansweredQueue hubId={hubId} />;
}