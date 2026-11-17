# FightLab architecture and database design

## Client/server request flow
```mermaid
flowchart LR
A[Browser] --> B[React and Vite]
B -->|JSON API requests| C[Express routes]
C --> D[JWT middleware]
D --> E[Controllers]
E --> F[Mongoose models]
F --> G[(MongoDB)]
G --> F --> E --> B
```

## User journey
```mermaid
flowchart TD
A[Open FightLab] --> B[Browse fighters and guides]
B --> C{Signed in?}
C -->|No| D[Register or log in]
D --> E[Create training plan]
C -->|Yes| E
E --> F[Choose fighter goal date and time]
F --> G[Express authenticates and validates]
G --> H[(MongoDB stores plan)]
H --> I[Calendar shows session]
I --> J[Edit reschedule complete or delete]
```

## Logical data relationships
```mermaid
erDiagram
 USER ||--o{ TRAINING_PLAN : owns
 USER ||--o{ PROGRESS_RECORD : owns
 USER { ObjectId _id string username string email string password_hash }
 TRAINING_PLAN { ObjectId _id ObjectId user string fighter string focus string goal string scheduledDate string startTime number duration string status }
 PROGRESS_RECORD { ObjectId _id ObjectId user string fighter }
 FIGHTER { ObjectId _id string name }
```

TrainingPlan.fighter is a **string**, not a MongoDB ObjectId reference to Fighter. The diagram therefore does not assert a database-enforced relationship between these collections. Confirm fields in `server/models/` before presenting a detailed physical model.

## Physical persistence
MongoDB collections are represented by Mongoose schemas in `server/models/`: User, Fighter, TrainingPlan, ProgressRecord, and Content. `TrainingPlan.user` references User._id; the training plan schema also defines an index on `(user, scheduledDate, startTime)` for calendar lookups. Authentication uses JWT in the request header and bcrypt password hashes.
