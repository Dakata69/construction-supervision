"""Minimal models registry.

The concrete model classes live under the package directory
`core/models/` (e.g. `project.py`, `task.py`, `document.py`, `team.py`).
This file only re-exports them so Django's standard app model import
(`core.models`) remains valid without duplicating definitions.
"""

from .models.project import Project  # noqa: F401
from .models.document import Document  # fixed import to actual class name
from .models.task import Task  # noqa: F401
from .models.team import Team  # noqa: F401
from .models.act import Act  # noqa: F401

__all__ = [
    'Project',
    'Document',
    'Task',
    'Team',
    'Act',
]
