# Communium AI Service

## CIN Extraction Integration

The CIN extraction pipeline is integrated as a native Communium feature:

- AI extraction endpoint (internal): `POST /cnie/extract-base64`
- Nest backend endpoint (authenticated): `POST /api/documents/cin/extract`
- Frontend entrypoint: `apps/frontend/src/components/kyc/CnieAutoExtract.tsx`

### Architecture

1. Frontend uploads CIN image to Nest API (`/api/documents/cin/extract`) with user JWT.
2. Nest `DocumentsService` calls AI service (`/cnie/extract-base64`) through `AiService`.
3. Nest persists extracted fields into `PersonalProfile` (identity and address fields).
4. Response is returned to frontend to prefill the KYC form.

### Required env

- Server (`apps/backend`): `AI_SERVICE_URL` (default `http://localhost:8000`)
- Client (`apps/frontend`): `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`)

### Notes

- AI service is extraction-only and does not own business persistence.
- Persistence and auth are centralized in the Nest backend.
