def user_is_representative_for_hub(user, hub_id):
    if not (user and user.is_authenticated):
        return False
    if user.is_admin:
        return True
    from .models import SchoolRepresentativeAssignment
    return SchoolRepresentativeAssignment.objects.filter(
        hub_id=hub_id, user=user, is_active=True
    ).exists()


def user_is_representative_for_school(user, school_id):
    if not (user and user.is_authenticated):
        return False
    if user.is_admin:
        return True
    from .models import SchoolRepresentativeAssignment
    return SchoolRepresentativeAssignment.objects.filter(
        hub__school_id=school_id, user=user, is_active=True
    ).exists()


def user_is_representative_for_any_hub(user):
    if not (user and user.is_authenticated):
        return False
    if user.is_admin:
        return True
    from .models import SchoolRepresentativeAssignment
    return SchoolRepresentativeAssignment.objects.filter(user=user, is_active=True).exists()


def user_is_staff(user):
    """Admin, OR any active moderator/representative assignment for ANY hub
    (unlike the hub-scoped helpers above, this checks role membership
    globally, since StaticPage visibility isn't tied to a specific hub)."""
    if not (user and user.is_authenticated):
        return False
    if user.is_admin:
        return True
    from .models import ModeratorAssignment, SchoolRepresentativeAssignment
    if ModeratorAssignment.objects.filter(user=user, is_active=True).exists():
        return True
    return SchoolRepresentativeAssignment.objects.filter(user=user, is_active=True).exists()
