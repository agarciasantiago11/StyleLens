from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from app.auth_deps import get_current_user
from app.models import Usuario
from app.services.email_service import send_support_report_email

router = APIRouter(prefix="/api/v1/soporte", tags=["soporte"])


@router.post("/reporte")
async def enviar_reporte_soporte(
    issue_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    evidencias: list[UploadFile] = File(default=[]),
    current_user: Usuario = Depends(get_current_user),
):
    if not issue_type.strip():
        raise HTTPException(status_code=400, detail="El tipo de problema es obligatorio")
    if not title.strip():
        raise HTTPException(status_code=400, detail="El título es obligatorio")
    if not description.strip():
        raise HTTPException(status_code=400, detail="La descripción es obligatoria")

    attachments: list[tuple[str, bytes, str | None]] = []
    for evidence in evidencias:
        file_bytes = await evidence.read()
        if not file_bytes:
            continue
        attachments.append((
            evidence.filename or "adjunto",
            file_bytes,
            evidence.content_type,
        ))

    try:
        send_support_report_email(
            issue_type=issue_type,
            title=title,
            description=description,
            reporter_email=current_user.email,
            attachments=attachments,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"No se pudo enviar el reporte: {exc}") from exc

    return {"message": "Reporte enviado correctamente"}
