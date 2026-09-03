"""In-memory state store for patient data, events, and engine states."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Optional

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.schemas.tracking import LocationPing
from mira_ml.schemas.telehealth import CallStatus
from mira_ml.profiling.engine import ProfilingEngine
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine, DifficultyState


@dataclass
class PatientState:
    patient_id: str
    events: list[GameEvent] = field(default_factory=list)
    profiling_engine: Optional[ProfilingEngine] = None
    profile: Optional[CognitiveProfile] = None
    difficulty_states: dict[str, DifficultyState] = field(default_factory=dict)
    recent_targets: list[str] = field(default_factory=list)
    last_updated: Optional[datetime] = None
    latest_location: Optional[LocationPing] = None
    location_history: list[LocationPing] = field(default_factory=list)
    call_status: Optional[CallStatus] = None

    def __post_init__(self):
        if self.profiling_engine is None:
            self.profiling_engine = ProfilingEngine(patient_id=self.patient_id)
        if self.call_status is None:
            self.call_status = CallStatus(patient_id=self.patient_id, is_calling=False, room_url="")


class PatientStore:
    """Thread-safe in-memory store for all patient data."""

    def __init__(self):
        self._patients: dict[str, PatientState] = {}

    def get_or_create(self, patient_id: str) -> PatientState:
        if patient_id not in self._patients:
            self._patients[patient_id] = PatientState(patient_id=patient_id)
        return self._patients[patient_id]

    def add_events(self, patient_id: str, events: list[GameEvent]) -> None:
        state = self.get_or_create(patient_id)
        state.events.extend(events)
        state.last_updated = datetime.now(UTC)

    def get_events(self, patient_id: str) -> list[GameEvent]:
        state = self.get_or_create(patient_id)
        return state.events

    def get_profile(self, patient_id: str) -> Optional[CognitiveProfile]:
        state = self.get_or_create(patient_id)
        return state.profile

    def set_profile(self, patient_id: str, profile: CognitiveProfile) -> None:
        state = self.get_or_create(patient_id)
        state.profile = profile

    def get_difficulty_state(self, patient_id: str, game_id: str) -> DifficultyState:
        state = self.get_or_create(patient_id)
        if game_id not in state.difficulty_states:
            state.difficulty_states[game_id] = DifficultyState()
        return state.difficulty_states[game_id]

    def set_difficulty_state(self, patient_id: str, game_id: str, ds: DifficultyState) -> None:
        state = self.get_or_create(patient_id)
        state.difficulty_states[game_id] = ds

    def get_recent_targets(self, patient_id: str, limit: int = 5) -> list[str]:
        state = self.get_or_create(patient_id)
        return state.recent_targets[-limit:]

    def add_recent_target(self, patient_id: str, target: str) -> None:
        state = self.get_or_create(patient_id)
        state.recent_targets.append(target)
        if len(state.recent_targets) > 10:
            state.recent_targets = state.recent_targets[-10:]

    def update_location(self, ping: LocationPing) -> None:
        state = self.get_or_create(ping.patient_id)
        state.latest_location = ping
        state.location_history.append(ping)
        state.last_updated = datetime.now(UTC)

    def get_latest_location(self, patient_id: str) -> Optional[LocationPing]:
        state = self.get_or_create(patient_id)
        return state.latest_location

    def get_location_history(self, patient_id: str, limit: int = 50) -> list[LocationPing]:
        state = self.get_or_create(patient_id)
        return state.location_history[-limit:]

    def set_call_status(self, call_status: CallStatus) -> CallStatus:
        state = self.get_or_create(call_status.patient_id)
        state.call_status = call_status
        state.last_updated = datetime.now(UTC)
        return state.call_status

    def get_call_status(self, patient_id: str) -> CallStatus:
        state = self.get_or_create(patient_id)
        if state.call_status is None:
            state.call_status = CallStatus(patient_id=patient_id, is_calling=False, room_url="")
        return state.call_status

    def list_patients(self) -> list[str]:
        return list(self._patients.keys())


# Global singleton
store = PatientStore()
