# Specification Rules

The specifications are stored in the `/spec` directory and are structured in a tree as follows:

- /spec/spec.md - root specification for the project.
- /spec/spec-[a-z0-9-]+.md - child specifications, where each specification is referenced by its
  parent specification, up to the root.


The specification describes the software system as a black-box, it ignores implementation details.
It is complete in that it provides all the information required to implement the software system
from scratch. It therefore details any parts that are exposed to users or other systems in their
entirety.

Each specification file consists of the following:

- Frontmatter metadata:
  - Title
  - Version
  - Date Created
  - Last Updated
- 1. Purpose
  - A short description of the purpose of this software.
- 2. Scope & Context
  - what the system will and will not do, how it fits into its environment, and what other systems
   it interacts with
- 3. Glossary
  - A set of definititions for vocabulary, ensuring terms in the spec are unambiguous.
- 4. Core Features
  - A list of the core features.
- 5. User Stories
  - A list of the system behaviours from a user's point of view. The user may be a person, or another.
- 6. Functional Requirements
  - A list of the system behaviours in detail.
- 7. Non-functional Requirements
  - A list of non-functional requirements as is normally understood by the term. The should include
    all requirements not covered by the User.
  - 7.1. Usability
  - 7.2. Compatibility
  - 7.1. Performance & Capacity
    - Specific performance, concurrency, scalability, etc considerations.
  - 7.2. Reliability & Availability
    - SLO, etc
  - 7.3. Security & Privacy
    - Specific security and privacy considerations.
  - 7.4. Compliance
    - e.g. GDPR, etc
- 8. Constraints & Assumptions
  - 8.1. Constraints
    - Implementation constraints
  - 8.2. Assupmtions
    - any assumptions not included elsewhere.
- 9. API (Smithy IDL)
  - The interface of the software to other software.
  - Written EXCLUSIVELY in language agnostic Smithy IDL, no matter the software system language.
  - Smithy can and must describe code APIs, HTTP APIS, validation rules, etc.
  - If an aspect of the interface cannot be described directly in Smithy, use Smithy comments
    to descibe it along with the Smithy interface (e.g. calling orders, etc).
- 10. Error Handling
  - General rules for error handling
  - Error conditions
- 12. User Interface
  - If the software has a user interface, this section provides descriptions and links to images
    of every aspect of the user interface(s).
  - ui files are stored in /spec/ui
- 13. Acceptance Criteria
  - How requirements will be verified to have been implemented
- References
  - Links to child specification files, e.g.
    - API: [/spec/spec-api.md](/spec/spec-api.md)