# Vision Subsystem — Phases 8 & 9

Memory Prosthetic face and object recognition for offline-assisted daily recall.

## Architecture

```
Camera Frame
    → Face/Object Detection
    → Embedding
    → Cosine Similarity Matching
    → Identity + Confidence
    → Voice/UI Response
```

## Modules

### Face Recognition (`vision/face/recognition.py`)

| Component | Purpose |
|-----------|---------|
| `FaceEnrollmentStore` | In-memory store for enrolled face embeddings (averaged per identity) |
| `FaceMatchConfig` | Thresholds: `known_threshold` (0.75), `uncertain_threshold` (0.50) |
| `match_face()` | Match query embedding against enrolled identities |
| `cosine_similarity()` | Vector similarity computation |

### Object Recognition (`vision/object/recognition.py`)

| Component | Purpose |
|-----------|---------|
| `ObjectEnrollmentStore` | In-memory store for personal object embeddings |
| `ObjectMatchConfig` | Thresholds: `known_threshold` (0.70), `uncertain_threshold` (0.45) |
| `match_object()` | Match query embedding against enrolled objects |

Target objects: keys, glasses, wallet, phone, medicine box, bottle, walking stick.

## Status Model

| Status | Meaning |
|--------|---------|
| `KNOWN` | similarity ≥ known_threshold — identity confirmed |
| `UNCERTAIN` | uncertain_threshold ≤ similarity < known_threshold — low confidence, no forced identity |
| `UNKNOWN` | similarity < uncertain_threshold — not matched |
| `ERROR` | invalid input (wrong dimensions, empty embedding) |

**Critical rule**: never force an identity when confidence is low.

## Schemas (`schemas/vision.py`)

- `VisionStatus` — enum: KNOWN, UNKNOWN, UNCERTAIN, ERROR
- `BoundingBox` — x, y, width, height (normalized 0-1)
- `FaceRecognitionResult` — identity_id, identity_label, confidence, status, bounding_box, inference_time_ms
- `ObjectRecognitionResult` — object_id, object_label, confidence, status, bounding_box, inference_time_ms
- `EnrolledIdentity` / `EnrolledObject` — enrollment metadata

## Usage

```python
from mira_ml.vision.face.recognition import FaceEnrollmentStore, match_face

store = FaceEnrollmentStore()
store.enroll("f-001", "Daughter Ananya", embeddings)

result = match_face(query_embedding, store, patient_id="p-001")
if result.status == VisionStatus.KNOWN:
    print(f"Recognized: {result.identity_label}")
```

## Offline-First Design

- All matching is local cosine similarity — no network required
- Stores are in-memory (production: local DB/file for persistence)
- Designed for on-device inference (MobileFaceNet / SSD-MobileNet)

## Test Coverage

- **Face**: 26 tests — cosine similarity, enrollment store, matching, thresholds, determinism
- **Object**: 15 tests — enrollment store, matching, thresholds, confidence bounds

## Limitations (Prototype)

- In-memory stores only (not persistent across app restarts)
- No face detection pipeline (expects pre-detected embeddings)
- No embedding model integration (plugged in at integration layer)
- No re-enrollment or update of existing identities
