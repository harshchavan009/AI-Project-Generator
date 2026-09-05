import ast
from typing import Dict, List, Any

class AstCodeAnalyzer:
    def analyze_python_code(self, source_code: str, file_path: str = "main.py") -> Dict[str, Any]:
        """
        Parses Python code into an Abstract Syntax Tree (AST):
        - Detects imports, frameworks, async coroutines, class hierarchies, error handling
        - Generates targeted viva defense questions anchored in actual architectural choices
        """
        try:
            tree = ast.parse(source_code)
        except SyntaxError as e:
            return {
                "valid": False,
                "error": f"Syntax error on line {e.lineno}: {e.msg}",
                "imports": [],
                "functions": [],
                "classes": [],
                "viva_questions": []
            }

        imports = []
        from_imports = []
        functions = []
        async_functions = []
        classes = []
        has_bare_except = False
        has_with_blocks = False
        has_try_blocks = False
        has_recursion = False

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for alias in node.names:
                    from_imports.append(f"{mod}.{alias.name}")
            elif isinstance(node, ast.FunctionDef):
                functions.append(node.name)
            elif isinstance(node, ast.AsyncFunctionDef):
                async_functions.append(node.name)
            elif isinstance(node, ast.ClassDef):
                bases = [ast.unparse(b) for b in node.bases] if hasattr(ast, "unparse") else []
                classes.append({"name": node.name, "bases": bases})
            elif isinstance(node, ast.Try):
                has_try_blocks = True
                for handler in node.handlers:
                    if handler.type is None:
                        has_bare_except = True
            elif isinstance(node, (ast.With, ast.AsyncWith)):
                has_with_blocks = True

        all_modules = set(imports + [fi.split(".")[0] for fi in from_imports])

        # Generate targeted viva voce questions based on code inspection
        viva_questions = []

        # 1. Asynchronous concurrency questions
        if async_functions:
            func_samples = ", ".join(f"`{f}()`" for f in async_functions[:2])
            viva_questions.append({
                "category": "Concurrency & Event Loop Execution",
                "question": f"In {func_samples}, you implemented cooperative multitasking via `async def`. If an underlying library call blocks on CPU computation or synchronous file I/O, how does that impact the overall FastAPI/Uvicorn event loop throughput, and how would you offload it to `run_in_threadpool` or a Celery worker?",
                "evaluated_construct": f"Async functions: {func_samples}",
                "expected_keywords": ["non-blocking", "event loop starvation", "threadpool", "GIL", "task queue"]
            })

        # 2. Deep learning / ONNX quantization questions
        if any(m in all_modules for m in ["torch", "tensorflow", "onnxruntime", "fastembed"]):
            detected_ml = [m for m in ["torch", "tensorflow", "onnxruntime", "fastembed"] if m in all_modules]
            viva_questions.append({
                "category": "Model Inference Optimization & Quantization",
                "question": f"Your implementation relies on `{detected_ml[0]}`. Explain the architectural trade-offs between FP32 and INT8 quantization regarding memory bandwidth, matrix multiply latency, and potential loss in calibration accuracy during edge deployment.",
                "evaluated_construct": f"ML imports: {detected_ml}",
                "expected_keywords": ["quantization aware training", "post-training quantization", "zero-point", "dynamic range", "cache miss"]
            })

        # 3. Database & Persistence questions
        if any(m in all_modules for m in ["sqlalchemy", "sqlite3", "aiosqlite", "psycopg2", "asyncpg"]):
            viva_questions.append({
                "category": "Persistence & ACID Guarantees",
                "question": "How does your data layer prevent race conditions and dirty reads when multiple concurrent requests write to the database simultaneously? What transaction isolation level is configured?",
                "evaluated_construct": "Database driver integration",
                "expected_keywords": ["WAL mode", "ACID", "connection pooling", "optimistic locking", "isolation levels"]
            })

        # 4. Error Handling & Fault Tolerance
        if has_bare_except:
            viva_questions.append({
                "category": "Defensive Engineering & Robustness",
                "question": "Static analysis detected a bare `except:` block. Why is catching all exceptions without type discrimination considered an anti-pattern in production microservices, and how does it mask keyboard interrupts and system exits?",
                "evaluated_construct": "Bare except handler detected",
                "expected_keywords": ["KeyboardInterrupt", "SystemExit", "explicit exception hierarchy", "fail-fast"]
            })
        elif has_try_blocks:
            viva_questions.append({
                "category": "Error Boundaries & Graceful Degradation",
                "question": "You implemented structured `try/except` error boundaries. How does your service ensure idempotent recovery when external network dependencies fail mid-execution?",
                "evaluated_construct": "Exception recovery blocks",
                "expected_keywords": ["circuit breaker", "exponential backoff", "idempotency key", "dead-letter queue"]
            })

        # 5. Modular OOP Architecture
        if classes:
            class_names = ", ".join(f"`{c['name']}`" for c in classes[:2])
            viva_questions.append({
                "category": "Object-Oriented Design & Encapsulation",
                "question": f"In {class_names}, explain how your class hierarchy adheres to the Single Responsibility and Dependency Inversion principles. How would you mock this component in automated unit tests?",
                "evaluated_construct": f"Class definitions: {class_names}",
                "expected_keywords": ["dependency injection", "mocking", "interface segregation", "unit testing"]
            })

        # 6. General fallback viva question if few constructs are present
        if len(viva_questions) < 3:
            viva_questions.append({
                "category": "System Scalability & Production Readiness",
                "question": "If your project's concurrent active user base scales 100x from 50 to 5,000 requests per second, which component of your architecture becomes the primary bottleneck first, and what horizontal scaling strategy would you deploy?",
                "evaluated_construct": "Full system architecture",
                "expected_keywords": ["horizontal pod autoscaling", "read-replicas", "Redis caching", "load balancer", "connection pool limits"]
            })

        return {
            "valid": True,
            "file_path": file_path,
            "stats": {
                "detected_modules": sorted(list(all_modules)),
                "function_count": len(functions),
                "async_function_count": len(async_functions),
                "class_count": len(classes),
                "has_context_managers": has_with_blocks,
                "has_exception_handling": has_try_blocks
            },
            "classes": classes,
            "functions": functions[:10],
            "async_functions": async_functions[:10],
            "viva_questions": viva_questions
        }

# Global singleton
ast_analyzer = AstCodeAnalyzer()
