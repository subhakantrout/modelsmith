import pytest
import os
import json
from backend.core.project_manager import (
    list_projects,
    save_project,
    load_project,
    delete_project,
    save_checkpoint,
    export_recipe,
    import_recipe,
    list_recipes,
    PROJECTS_DIR,
)


def test_list_projects_empty():
    projects = list_projects()
    assert isinstance(projects, list)


def test_save_and_load_project():
    save_project("test-123", "Test Project", {"nodes": [], "edges": []})
    try:
        loaded = load_project("test-123")
        assert loaded["name"] == "Test Project"
        assert loaded["id"] == "test-123"
        assert "created" in loaded
        assert "updated" in loaded
    finally:
        delete_project("test-123")


def test_save_project_with_nodes():
    nodes = [{"id": "1", "type": "modelInput"}]
    edges = [{"id": "e1", "source": "1", "target": "2"}]
    save_project("test-nodes", "Node Test", {"nodes": nodes, "edges": edges})
    try:
        loaded = load_project("test-nodes")
        assert len(loaded["nodes"]) == 1
        assert len(loaded["edges"]) == 1
    finally:
        delete_project("test-nodes")


def test_load_nonexistent_project():
    with pytest.raises(FileNotFoundError):
        load_project("nonexistent-id-xyz")


def test_delete_nonexistent_project():
    with pytest.raises(FileNotFoundError):
        delete_project("nonexistent-id-xyz")


def test_save_project_overwrites():
    save_project("overwrite-test", "Original", {"nodes": [], "edges": []})
    save_project("overwrite-test", "Updated", {"nodes": [{"id": "1"}], "edges": []})
    try:
        loaded = load_project("overwrite-test")
        assert loaded["name"] == "Updated"
        assert len(loaded["nodes"]) == 1
    finally:
        delete_project("overwrite-test")


def test_save_project_id_is_used():
    save_project("special-id-999", "Any Name", {"nodes": [], "edges": []})
    try:
        loaded = load_project("special-id-999")
        assert loaded["id"] == "special-id-999"
    finally:
        delete_project("special-id-999")


def test_save_checkpoint_creates_file():
    name = save_checkpoint("test", {"key": "value"})
    path = os.path.join(PROJECTS_DIR, f"{name}.json")
    assert os.path.exists(path)
    with open(path) as f:
        data = json.load(f)
    assert data["stage"] == "test"
    assert data["data"]["key"] == "value"
    os.remove(path)


def test_export_recipe_and_list():
    save_project("recipe-test", "Recipe Test", {"nodes": [{"id": "1", "type": "modelInput"}], "edges": []})
    try:
        exported = export_recipe("recipe-test")
        assert exported["status"] == "exported"
        assert exported["recipe"]["name"] == "Recipe Test"
        recipes = list_recipes()
        names = [r["name"] for r in recipes]
        assert "Recipe Test" in names
    finally:
        delete_project("recipe-test")


def test_export_recipe_nonexistent():
    with pytest.raises(FileNotFoundError):
        export_recipe("nonexistent-recipe-xyz")


def test_import_recipe_nonexistent():
    with pytest.raises(FileNotFoundError):
        import_recipe("/nonexistent/recipe.json")


def test_list_recipes_returns_list():
    recipes = list_recipes()
    assert isinstance(recipes, list)


def test_save_project_empty_nodes():
    save_project("empty-test", "Empty", {"nodes": [], "edges": []})
    try:
        loaded = load_project("empty-test")
        assert loaded["nodes"] == []
        assert loaded["edges"] == []
    finally:
        delete_project("empty-test")


def test_list_projects_after_save():
    save_project("list-test-1", "First", {"nodes": [], "edges": []})
    save_project("list-test-2", "Second", {"nodes": [{"id": "a"}], "edges": []})
    try:
        projects = list_projects()
        names = [p["name"] for p in projects]
        assert "First" in names
        assert "Second" in names
        for p in projects:
            if p["id"] == "list-test-2":
                assert p["node_count"] == 1
            if p["id"] == "list-test-1":
                assert p["node_count"] == 0
    finally:
        delete_project("list-test-1")
        delete_project("list-test-2")
