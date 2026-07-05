from rest_framework.throttling import ScopedRateThrottle


class MethodScopedThrottle(ScopedRateThrottle):
    """
    A ScopedRateThrottle that only counts against specific HTTP methods.
    Views set `throttled_methods` (defaults to ["POST"]) to control which
    methods get the scoped rate; other methods pass through untouched by
    this throttle (though the view's other throttle_classes still apply).
    """

    def allow_request(self, request, view):
        throttled_methods = getattr(view, "throttled_methods", ["POST"])
        if request.method not in throttled_methods:
            return True
        return super().allow_request(request, view)
