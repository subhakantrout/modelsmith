from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from backend.core.project_manager import (
    list_projects, save_project, load_project, delete_project,
    export_recipe, import_recipe, list_recipes,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectSaveRequest(BaseModel):
    id: str
    name: str
    nodes: list[Any] = []
    edges: list[Any] = []


@router.get("/")
async def project_list():
    return {"projects": list_projects()}


@router.post("/save")
async def project_save(req: ProjectSaveRequest):
    return save_project(req.id, req.name, {"nodes": req.nodes, "edges": req.edges})


@router.get("/load/{project_id}")
async def project_load(project_id: str):
    try:
        return load_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")


@router.delete("/delete/{project_id}")
async def project_delete(project_id: str):
    try:
        return delete_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")


@router.post("/export-recipe/{project_id}")
async def export_recipe_endpoint(project_id: str):
    try:
        return export_recipe(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")


class ImportRecipeRequest(BaseModel):
    path: str


@router.post("/import-recipe")
async def import_recipe_endpoint(req: ImportRecipeRequest):
    try:
        return import_recipe(req.path)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/recipes")
async def recipe_list():
    return {"recipes": list_recipes()}
