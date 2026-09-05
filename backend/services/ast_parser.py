"""
AST Parser: Recursively parses Python (.py) source files using the standard
library `ast` compiler module. Extracts imports, classes, functions, calls, and docstrings.
"""

import os
import ast
from typing import Dict, Any, List, Set, Optional, Callable


class CodeVisitor(ast.NodeVisitor):
    """AST NodeVisitor extracting structural syntax trees for a single Python file."""

    def __init__(self, file_rel_path: str):
        self.file_rel_path = file_rel_path
        self.imports: List[Dict[str, Any]] = []
        self.classes: List[Dict[str, Any]] = []
        self.functions: List[Dict[str, Any]] = []
        self.current_class: Optional[str] = None
        self.current_function: Optional[str] = None
        self.calls_by_context: Dict[str, Set[str]] = {}

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.append({
                "module": alias.name,
                "name": alias.asname or alias.name,
                "is_from": False,
                "level": 0,
                "lineno": node.lineno,
            })
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        module = node.module or ""
        level = node.level or 0
        for alias in node.names:
            self.imports.append({
                "module": module,
                "name": alias.name,
                "asname": alias.asname or alias.name,
                "is_from": True,
                "level": level,
                "lineno": node.lineno,
            })
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        prev_class = self.current_class
        class_name = node.name
        self.current_class = class_name

        bases = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                bases.append(base.id)
            elif isinstance(base, ast.Attribute):
                bases.append(f"{ast.unparse(base.value)}.{base.attr}" if hasattr(ast, "unparse") else base.attr)

        docstring = ast.get_docstring(node) or ""

        self.classes.append({
            "id": f"{self.file_rel_path}::{class_name}",
            "name": class_name,
            "file": self.file_rel_path,
            "bases": bases,
            "docstring": docstring.strip(),
            "lineno": node.lineno,
            "end_lineno": getattr(node, "end_lineno", node.lineno),
        })

        self.generic_visit(node)
        self.current_class = prev_class

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._handle_func(node, is_async=False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._handle_func(node, is_async=True)

    def _handle_func(self, node, is_async: bool):
        prev_func = self.current_function
        func_name = node.name
        scoped_name = f"{self.current_class}.{func_name}" if self.current_class else func_name
        self.current_function = scoped_name

        # Extract arguments signature
        args = []
        for arg in node.args.args:
            args.append(arg.arg)
        if node.args.vararg:
            args.append(f"*{node.args.vararg.arg}")
        if node.args.kwarg:
            args.append(f"**{node.args.kwarg.arg}")

        sig = f"def {func_name}({', '.join(args)})"
        if is_async:
            sig = f"async {sig}"

        docstring = ast.get_docstring(node) or ""

        context_key = f"{self.file_rel_path}::{scoped_name}"
        if context_key not in self.calls_by_context:
            self.calls_by_context[context_key] = set()

        self.functions.append({
            "id": context_key,
            "name": func_name,
            "scoped_name": scoped_name,
            "file": self.file_rel_path,
            "class": self.current_class,
            "signature": sig,
            "docstring": docstring.strip(),
            "lineno": node.lineno,
            "end_lineno": getattr(node, "end_lineno", node.lineno),
            "is_async": is_async,
        })

        self.generic_visit(node)
        self.current_function = prev_func

    def visit_Call(self, node: ast.Call):
        called_name = None
        if isinstance(node.func, ast.Name):
            called_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            called_name = node.func.attr

        if called_name:
            context = f"{self.file_rel_path}::{self.current_function}" if self.current_function else self.file_rel_path
            if context not in self.calls_by_context:
                self.calls_by_context[context] = set()
            self.calls_by_context[context].add(called_name)

        self.generic_visit(node)


def parse_single_file(root_dir: str, file_path: str) -> Optional[Dict[str, Any]]:
    """Parses a single Python file into AST metadata."""
    rel_path = os.path.relpath(file_path, root_dir)
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            code = f.read()

        tree = ast.parse(code, filename=rel_path)
        module_doc = ast.get_docstring(tree) or ""

        visitor = CodeVisitor(rel_path)
        visitor.visit(tree)

        # Convert set of calls to list
        calls = {k: list(v) for k, v in visitor.calls_by_context.items()}

        return {
            "file": rel_path,
            "docstring": module_doc.strip(),
            "imports": visitor.imports,
            "classes": visitor.classes,
            "functions": visitor.functions,
            "calls": calls,
            "loc": len(code.splitlines()),
        }
    except SyntaxError:
        # Gracefully handle non-parsable or invalid syntax scripts
        return None
    except Exception:
        return None


def parse_repository(root_dir: str, progress_callback: Optional[Callable[[int, str], None]] = None) -> Dict[str, Any]:
    """
    Recursively scans and parses all .py files in a repository.
    Skips common ignorable directories (.git, __pycache__, virtualenvs, etc.).
    """
    ignored_dirs = {
        ".git", "__pycache__", "venv", ".venv", "env", "build",
        "dist", "node_modules", ".tox", ".pytest_cache", ".mypy_cache"
    }

    parsed_files: List[Dict[str, Any]] = []
    total_scanned = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs and not d.startswith(".")]

        for file in filenames:
            if file.endswith(".py"):
                full_path = os.path.join(dirpath, file)
                result = parse_single_file(root_dir, full_path)
                if result:
                    parsed_files.append(result)
                    total_scanned += 1
                    if progress_callback:
                        progress_callback(total_scanned, result["file"])

    return {
        "total_files": len(parsed_files),
        "files": parsed_files,
    }
