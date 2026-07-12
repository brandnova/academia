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
