from .models import AdminActionLog


def log_admin_action(actor, action, target_type, target_id, target_label="", metadata=None):
    """Single entry point for writing an audit entry. Call it inside the same
    transaction.atomic() block as the action it records, so the action and
    its log entry succeed or roll back together. metadata must be
    JSON-serializable (pass str(uuid), not a UUID object)."""
    return AdminActionLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_label=str(target_label)[:255],
        metadata=metadata or {},
    )
