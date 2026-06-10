"""Compatibility shims applied before any heavy ML imports.

`transformers==4.44.2` (via `accelerate==0.34.2`) probes for the optional
`codecarbon` package at import time using `importlib.util.find_spec`. On
this stack that probe raises instead of returning `None`, which crashes
the import of `sentence-transformers`/`transformers` even though
`codecarbon` is never actually used by this service.

To work around it, we register a fake `codecarbon` module in
`sys.modules` and patch `importlib.util.find_spec` so the probe always
succeeds for `codecarbon` and resolves to our dummy module. This must run
before `app.main` imports `sentence_transformers`/`transformers`.

Remove this shim once the upstream `transformers`/`accelerate` versions
are upgraded past this bug (or `codecarbon` is properly installed).
"""

import sys
import importlib.util
from types import ModuleType


class DummyEmissionsTracker:
    def __init__(self, *args, **kwargs):
        pass

    def start(self):
        pass

    def stop(self, *args, **kwargs):
        pass


def install_codecarbon_shim() -> None:
    mock_codecarbon = ModuleType("codecarbon")
    mock_codecarbon.EmissionsTracker = DummyEmissionsTracker
    sys.modules["codecarbon"] = mock_codecarbon

    orig_find_spec = importlib.util.find_spec

    def patched_find_spec(name, package=None):
        if name == "codecarbon":
            class DummySpec:
                loader = None
                submodule_search_locations = None
                origin = "mock"

            return DummySpec()
        return orig_find_spec(name, package)

    importlib.util.find_spec = patched_find_spec
