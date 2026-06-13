import json
import os
import logging
from datetime import datetime

logger = logging.getLogger("modelsmith.project_manager")

PROJECTS_DIR = os.path.expanduser("~/.modelsmith/projects")


def _ensure_dirs():
    os.makedirs(PROJECTS_DIR, exist_ok=True)


def list_projects() -> list[dict]:
    _ensure_dirs()
    projects = []
    for fname in os.listdir(PROJECTS_DIR):
        if fname.endswith(".json"):
            try:
                with open(os.path.join(PROJECTS_DIR, fname)) as f:
                    data = json.load(f)
                projects.append({
                    "id": fname.replace(".json", ""),
                    "name": data.get("name", fname),
                    "created": data.get("created", ""),
                    "updated": data.get("updated", ""),
                    "node_count": len(data.get("nodes", [])),
                })
            except Exception as e:
                logger.warning(f"Error reading project {fname}: {e}")
    projects.sort(key=lambda x: x.get("updated", ""), reverse=True)
    return projects


def save_project(project_id: str, name: str, data: dict) -> dict:
    _ensure_dirs()
    now = datetime.now().isoformat()
    try:
        existing = load_project(project_id)
        created = existing.get("created", now)
    except FileNotFoundError:
        created = now
    project = {
        "id": project_id,
        "name": name,
        "created": created,
        "updated": now,
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "version": 2,
    }
    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    with open(path, "w") as f:
        json.dump(project, f, indent=2)
    return {"status": "saved", "id": project_id, "path": path}


def load_project(project_id: str) -> dict:
    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Project not found: {project_id}")
    with open(path) as f:
        return json.load(f)


def delete_project(project_id: str) -> dict:
    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted", "id": project_id}
    raise FileNotFoundError(f"Project not found: {project_id}")


RECIPES_DIR = os.path.expanduser("~/.modelsmith/recipes")


def _ensure_recipe_dirs():
    os.makedirs(RECIPES_DIR, exist_ok=True)


def export_recipe(project_id: str) -> dict:
    project = load_project(project_id)
    _ensure_recipe_dirs()
    recipe = {
        "name": project.get("name", "Untitled"),
        "description": project.get("description", ""),
        "nodes": project.get("nodes", []),
        "edges": project.get("edges", []),
        "version": 1,
        "type": "recipe",
    }
    recipe_path = os.path.join(RECIPES_DIR, f"{project_id}.recipe.json")
    with open(recipe_path, "w") as f:
        json.dump(recipe, f, indent=2)
    return {"status": "exported", "path": recipe_path, "recipe": recipe}


def import_recipe(file_path: str) -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Recipe not found: {file_path}")
    with open(file_path) as f:
        recipe = json.load(f)
    if recipe.get("type") != "recipe":
        raise ValueError("Invalid recipe file")
    return {
        "status": "imported",
        "name": recipe.get("name", "Imported"),
        "nodes": recipe.get("nodes", []),
        "edges": recipe.get("edges", []),
    }


def list_recipes() -> list[dict]:
    _ensure_recipe_dirs()
    recipes = []
    for fname in os.listdir(RECIPES_DIR):
        if fname.endswith(".recipe.json"):
            try:
                with open(os.path.join(RECIPES_DIR, fname)) as f:
                    data = json.load(f)
                recipes.append({
                    "id": fname.replace(".recipe.json", ""),
                    "name": data.get("name", fname),
                    "description": data.get("description", ""),
                    "node_count": len(data.get("nodes", [])),
                })
            except Exception as e:
                logger.warning(f"Error reading recipe {fname}: {e}")
    return recipes


def save_checkpoint(stage: str, data: dict) -> str:
    _ensure_dirs()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"checkpoint_{stage}_{timestamp}"
    path = os.path.join(PROJECTS_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump({"stage": stage, "timestamp": timestamp, "data": data}, f, indent=2)
    return name
