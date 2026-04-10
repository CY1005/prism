from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from api.schemas.test_points import TestPointsRequest, TestPointsResponse
from api.services.analyzer import analyze_requirement
from api.services.test_point_generator import generate_test_points

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """Analyze a requirement's impact scope across project modules."""
    result = analyze_requirement(
        db=db,
        project_id=req.project_id,
        requirement_text=req.requirement_text,
        include_modules=req.context.include_modules if req.context else None,
    )
    return result


@router.post("/test-points", response_model=TestPointsResponse)
def test_points(req: TestPointsRequest):
    """Generate test points based on requirement and affected modules."""
    result = generate_test_points(
        requirement_text=req.requirement_text,
        affected_modules=req.affected_modules,
        test_depth=req.test_depth,
    )
    return result
