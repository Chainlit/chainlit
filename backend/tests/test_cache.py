import sys
import threading
from unittest.mock import Mock, patch

import pytest

from chainlit.cache import cache, init_lc_cache

# Import the actual cache module to access _cache dict
cache_module = sys.modules["chainlit.cache"]


class TestCacheDecorator:
    """Test suite for the @cache decorator."""

    def setup_method(self):
        """Clear the cache before each test."""
        cache_module._cache.clear()

    def teardown_method(self):
        """Clear the cache after each test."""
        cache_module._cache.clear()

    def test_cache_basic_function(self):
        """Test that cache decorator caches function results."""
        call_count = 0

        @cache
        def add(a, b):
            nonlocal call_count
            call_count += 1
            return a + b

        # First call
        result1 = add(2, 3)
        assert result1 == 5
        assert call_count == 1

        # Second call with same args should use cache
        result2 = add(2, 3)
        assert result2 == 5
        assert call_count == 1  # Function not called again

    def test_cache_different_arguments(self):
        """Test that different arguments create different cache entries."""
        call_count = 0

        @cache
        def multiply(x, y):
            nonlocal call_count
            call_count += 1
            return x * y

        result1 = multiply(2, 3)
        assert result1 == 6
        assert call_count == 1

        result2 = multiply(4, 5)
        assert result2 == 20
        assert call_count == 2  # Different args, function called again

        # Same args as first call, should use cache
        result3 = multiply(2, 3)
        assert result3 == 6
        assert call_count == 2  # Cache hit, no new call

    def test_cache_with_kwargs(self):
        """Test that cache works with keyword arguments."""
        call_count = 0

        @cache
        def greet(name, greeting="Hello"):
            nonlocal call_count
            call_count += 1
            return f"{greeting}, {name}!"

        result1 = greet("Alice", greeting="Hi")
        assert result1 == "Hi, Alice!"
        assert call_count == 1

        # Same call should use cache
        result2 = greet("Alice", greeting="Hi")
        assert result2 == "Hi, Alice!"
        assert call_count == 1

        # Different kwargs should call function
        result3 = greet("Alice", greeting="Hello")
        assert result3 == "Hello, Alice!"
        assert call_count == 2

    def test_cache_kwargs_order_independence(self):
        """Test that kwargs order doesn't affect cache key."""
        call_count = 0

        @cache
        def func(a=1, b=2, c=3):
            nonlocal call_count
            call_count += 1
            return a + b + c

        result1 = func(a=1, b=2, c=3)
        assert result1 == 6
        assert call_count == 1

        # Same kwargs, different order - should use cache
        result2 = func(c=3, a=1, b=2)
        assert result2 == 6
        assert call_count == 1  # Cache hit

    def test_cache_mixed_args_and_kwargs(self):
        """Test cache with both positional and keyword arguments."""
        call_count = 0

        @cache
        def compute(x, y, z=10):
            nonlocal call_count
            call_count += 1
            return x + y + z

        result1 = compute(1, 2, z=3)
        assert result1 == 6
        assert call_count == 1

        result2 = compute(1, 2, z=3)
        assert result2 == 6
        assert call_count == 1  # Cache hit

        result3 = compute(1, 2, z=5)
        assert result3 == 8
        assert call_count == 2  # Different z value

    def test_cache_with_no_arguments(self):
        """Test cache with functions that take no arguments."""
        call_count = 0

        @cache
        def get_constant():
            nonlocal call_count
            call_count += 1
            return 42

        result1 = get_constant()
        assert result1 == 42
        assert call_count == 1

        result2 = get_constant()
        assert result2 == 42
        assert call_count == 1  # Cache hit

    def test_cache_with_mutable_return_value(self):
        """Test that cache returns the same object reference."""
        call_count = 0

        @cache
        def get_list():
            nonlocal call_count
            call_count += 1
            return [1, 2, 3]

        result1 = get_list()
        assert result1 == [1, 2, 3]
        assert call_count == 1

        result2 = get_list()
        assert result2 == [1, 2, 3]
        assert call_count == 1

        # Both results should be the same object
        assert result1 is result2

    def test_cache_thread_safety(self):
        """Test that cache is thread-safe."""
        call_count = 0
        call_lock = threading.Lock()

        @cache
        def slow_function(x):
            nonlocal call_count
            with call_lock:
                call_count += 1
            return x * 2

        results = []

        def worker():
            result = slow_function(5)
            results.append(result)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All results should be the same
        assert all(r == 10 for r in results)
        # Function should only be called once despite multiple threads
        assert call_count == 1

    def test_cache_different_functions_same_args(self):
        """Test that different functions with same args have separate cache."""
        call_count_1 = 0
        call_count_2 = 0

        @cache
        def func1(x):
            nonlocal call_count_1
            call_count_1 += 1
            return x + 1

        @cache
        def func2(x):
            nonlocal call_count_2
            call_count_2 += 1
            return x + 2

        result1 = func1(5)
        assert result1 == 6
        assert call_count_1 == 1

        result2 = func2(5)
        assert result2 == 7
        assert call_count_2 == 1

        # Both should use their own cache
        func1(5)
        func2(5)
        assert call_count_1 == 1
        assert call_count_2 == 1

    def test_cache_with_none_arguments(self):
        """Test cache with None as argument."""
        call_count = 0

        @cache
        def process(value):
            nonlocal call_count
            call_count += 1
            return value

        result1 = process(None)
        assert result1 is None
        assert call_count == 1

        result2 = process(None)
        assert result2 is None
        assert call_count == 1  # Cache hit

    def test_cache_preserves_function_behavior(self):
        """Test that cache decorator preserves original function behavior."""

        @cache
        def divide(a, b):
            return a / b

        assert divide(10, 2) == 5.0
        assert divide(10, 2) == 5.0  # Cached

        with pytest.raises(ZeroDivisionError):
            divide(10, 0)


class TestInitLcCache:
    """Test suite for init_lc_cache function."""

    def test_init_lc_cache_disabled_by_config(self):
        """Test that cache is not initialized when disabled in config."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = False
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = False

                with patch.object(
                    cache_module.importlib.util, "find_spec"
                ) as mock_find_spec:
                    init_lc_cache()

                    # Should not check for langchain if cache is disabled
                    mock_find_spec.assert_not_called()

    def test_init_lc_cache_disabled_by_no_cache_flag(self):
        """Test that cache is not initialized when no_cache flag is set."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = True
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = True

                with patch.object(
                    cache_module.importlib.util, "find_spec"
                ) as mock_find_spec:
                    init_lc_cache()

                    # Should not check for langchain if no_cache is True
                    mock_find_spec.assert_not_called()

    def test_init_lc_cache_langchain_not_installed(self):
        """Test behavior when langchain is not installed."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = True
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = False

                with patch.object(
                    cache_module.importlib.util, "find_spec", return_value=None
                ) as mock_find_spec:
                    # Should not raise an error
                    init_lc_cache()

                    mock_find_spec.assert_called_once_with("langchain")

    def test_init_lc_cache_with_langchain_installed(self):
        """Test cache initialization when langchain is installed."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = True
            mock_project.lc_cache_path = "/tmp/test_cache.db"
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = False

                mock_spec = Mock()
                with patch.object(
                    cache_module.importlib.util, "find_spec", return_value=mock_spec
                ):
                    # Mock langchain modules
                    mock_sqlite_cache = Mock()
                    mock_set_llm_cache = Mock()

                    with patch.dict(
                        sys.modules,
                        {
                            "langchain": Mock(),
                            "langchain.cache": Mock(SQLiteCache=mock_sqlite_cache),
                            "langchain.globals": Mock(set_llm_cache=mock_set_llm_cache),
                        },
                    ):
                        with patch("os.path.exists", return_value=True):
                            init_lc_cache()

                            mock_sqlite_cache.assert_called_once_with(
                                database_path="/tmp/test_cache.db"
                            )
                            mock_set_llm_cache.assert_called_once()

    def test_init_lc_cache_creates_new_cache_file(self):
        """Test that logger is called when creating new cache file."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = True
            mock_project.lc_cache_path = "/tmp/new_cache.db"
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = False

                mock_spec = Mock()
                with patch.object(
                    cache_module.importlib.util, "find_spec", return_value=mock_spec
                ):
                    mock_sqlite_cache = Mock()
                    mock_set_llm_cache = Mock()

                    with patch.dict(
                        sys.modules,
                        {
                            "langchain": Mock(),
                            "langchain.cache": Mock(SQLiteCache=mock_sqlite_cache),
                            "langchain.globals": Mock(set_llm_cache=mock_set_llm_cache),
                        },
                    ):
                        with patch("os.path.exists", return_value=False):
                            with patch.object(cache_module, "logger") as mock_logger:
                                init_lc_cache()

                                mock_logger.info.assert_called_once()
                                assert "LangChain cache created at" in str(
                                    mock_logger.info.call_args
                                )

    def test_init_lc_cache_without_cache_path(self):
        """Test that cache is not initialized when cache path is None."""
        with patch.object(cache_module.config, "project") as mock_project:
            mock_project.cache = True
            mock_project.lc_cache_path = None
            with patch.object(cache_module.config, "run") as mock_run:
                mock_run.no_cache = False

                mock_spec = Mock()
                with patch.object(
                    cache_module.importlib.util, "find_spec", return_value=mock_spec
                ):
                    mock_sqlite_cache = Mock()
                    mock_set_llm_cache = Mock()

                    with patch.dict(
                        sys.modules,
                        {
                            "langchain": Mock(),
                            "langchain.cache": Mock(SQLiteCache=mock_sqlite_cache),
                            "langchain.globals": Mock(set_llm_cache=mock_set_llm_cache),
                        },
                    ):
                        init_lc_cache()

                        # Should not call SQLiteCache if path is None
                        mock_sqlite_cache.assert_not_called()
                        mock_set_llm_cache.assert_not_called()


class TestCacheEdgeCases:
    """Test suite for cache edge cases."""

    def setup_method(self):
        """Clear the cache before each test."""
        cache_module._cache.clear()

    def teardown_method(self):
        """Clear the cache after each test."""
        cache_module._cache.clear()

    def test_cache_with_unhashable_arguments(self):
        """Test that cache handles unhashable arguments gracefully."""

        @cache
        def process_list(items):
            return sum(items)

        # Lists are unhashable and will cause an error
        with pytest.raises(TypeError):
            process_list([1, 2, 3])

    def test_cache_with_string_arguments(self):
        """Test cache with string arguments."""
        call_count = 0

        @cache
        def process_string(s):
            nonlocal call_count
            call_count += 1
            return s.upper()

        result1 = process_string("hello")
        assert result1 == "HELLO"
        assert call_count == 1

        result2 = process_string("hello")
        assert result2 == "HELLO"
        assert call_count == 1  # Cache hit

    def test_cache_with_tuple_arguments(self):
        """Test cache with tuple arguments."""
        call_count = 0

        @cache
        def process_tuple(t):
            nonlocal call_count
            call_count += 1
            return sum(t)

        result1 = process_tuple((1, 2, 3))
        assert result1 == 6
        assert call_count == 1

        result2 = process_tuple((1, 2, 3))
        assert result2 == 6
        assert call_count == 1  # Cache hit

    def test_cache_with_boolean_arguments(self):
        """Test cache with boolean arguments."""
        call_count = 0

        @cache
        def process_bool(flag):
            nonlocal call_count
            call_count += 1
            return "yes" if flag else "no"

        result1 = process_bool(True)
        assert result1 == "yes"
        assert call_count == 1

        result2 = process_bool(True)
        assert result2 == "yes"
        assert call_count == 1  # Cache hit

        result3 = process_bool(False)
        assert result3 == "no"
        assert call_count == 2

    def test_cache_global_state(self):
        """Test that cache is global across function calls."""

        @cache
        def func(x):
            return x * 2

        func(5)
        assert len(cache_module._cache) == 1

        func(10)
        assert len(cache_module._cache) == 2

        func(5)  # Cache hit
        assert len(cache_module._cache) == 2  # No new entry
