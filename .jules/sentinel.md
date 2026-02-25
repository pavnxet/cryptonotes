## 2025-02-13 - Blind Storage Limitations
**Vulnerability:** Lack of server-side validation for encrypted blobs allows users to upload excessively large payloads (DoS risk).
**Learning:** In "blind storage" applications where the server cannot decrypt content, traditional input validation (e.g., regex, content inspection) is impossible. Security must rely entirely on metadata validation (size, TTL, burn flag) and strict resource limits.
**Prevention:** Enforce strict size limits and metadata constraints at the API boundary before storing any data.
