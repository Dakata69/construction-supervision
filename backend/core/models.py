"""Minimal models registry.

The concrete model classes live under the package directory
`core/models/` (e.g. `project.py`, `task.py`, `document.py`, `team.py`).
This file only re-exports them so Django's standard app model import
(`core.models`) remains valid without duplicating definitions.
"""

from .models.project import Project
from .models.document import Document
from .models.task import Task
from .models.team import Team
from .models.act import Act

__all__ = [
    'Project',
    'Document',
    'Task',
    'Team',
    'Act',
]
